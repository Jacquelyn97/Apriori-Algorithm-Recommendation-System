# backend/services/apriori.py
from collections import Counter
from itertools import combinations
from db import get_conn

# 只看最近一段时间的订单，避免 20+ 年历史把支持度摊薄 / Use a recent window so decades of history do not dilute support
# 这里用「最近 180 天」即可，让规则既稳定又能反映近半年的趋势 / Use the recent 180 days for stable yet timely rules
TX_WINDOW_DAYS = 180

# 规则的全局最低门槛：达到这个，才会被当成候选规则（用于生成关联规则） / Global minimum threshold for candidate association rules
# 支持度 3.0、置信度 10.0（理解为 3% 和 10%） / Support 3.0 and confidence 10.0 mean 3% and 10%
MIN_SUPPORT = 0.03       # 规则用的最低支持度 ≈3.0% / Minimum support for rule generation
MIN_CONFIDENCE = 0.10    # 规则用的最低置信度 ≈10.0% / Minimum confidence for rule generation

# 频繁项集的最低支持度（只影响 1-项集 / 2-项集列表，不影响规则） / Minimum support for itemset lists only
# 为了让 2-项集有足够多的组合，这里用 0.3% / Use 0.3% to keep enough 2-item combinations
MIN_SUPPORT_ITEMSET = 0.003

# 分级门槛：参考你发的强/中/弱规则配置 / Rule grading thresholds (strong/medium/weak)
# 支持度用百分比的 0.x% 换算成 0.00x；置信度依旧用百分比；提升度用倍数 / Support is normalized, confidence is percent-based, lift is ratio-based
SIMPLE_THRESHOLDS = {
    # L1：套餐设计 / Bundle design
    "strong_rules": {
        "min_support": 0.008,   # ≥0.8%
        "min_confidence": 30.0, # ≥30%
        "min_lift": 3.0,        # ≥3.0
    },
    # L2：智能推荐 / Smart recommendation
    "medium_rules": {
        "min_support": 0.004,   # ≥0.4%
        "min_confidence": 12.0, # ≥12%
        "min_lift": 2.0,        # ≥2.0
    },
    # L3：陈列优化 / Shelf/display optimization
    "weak_rules": {
        "min_support": 0.003,   # ≥0.3%
        "min_confidence": 10.0, # ≥10%
        "min_lift": 1.8,        # ≥1.8
    },
    # L4：探索观察（只要求达到全局 MIN_* 即可） / Exploratory level (only needs global MIN_* thresholds)
}

def load_transactions():
    """
    加载事务（篮子）数据。
    Load basket transactions.
    这里改为「一张订单 = 一个篮子」。
    We treat one order as one basket.
    - 这样只有同一订单中共同出现的商品才计入组合统计。
    - Only products co-occurring in the same order contribute to pair counts.
    - 避免因为同一用户长期购买而让置信度虚高。
    - This avoids inflated confidence caused by long-term user-level co-purchase history.
    """
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT o.id AS order_id, oi.product_name_snap
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE o.status IN ('paid','picked','done')
              AND o.paid_at IS NOT NULL
              AND o.created_at >= CURDATE() - INTERVAL %s DAY
            """,
            (TX_WINDOW_DAYS,),
        )
        rows = cur.fetchall()
    conn.close()

    baskets = {}
    for r in rows:
        baskets.setdefault(r["order_id"], set()).add(r["product_name_snap"])
    return list(baskets.values())


def _classify_rule_level(support: float, confidence: float, lift: float) -> str:
    """
    根据支持度 / 置信度 / 提升度，将规则分为 L1~L4 四个等级。
    Classify rules into L1-L4 using support, confidence, and lift.
    - L1 套餐设计 / Bundle design: strong_rules
    - L2 智能推荐 / Smart recommendation: medium_rules
    - L3 陈列优化 / Display optimization: weak_rules
    - L4 探索观察 / Exploration: below L1-L3 but still above MIN_SUPPORT and MIN_CONFIDENCE
    """
    # 置信度我们用百分比来比对门槛 / Compare confidence thresholds in percentage
    c_pct = confidence * 100.0

    s1 = SIMPLE_THRESHOLDS["strong_rules"]
    if support >= s1["min_support"] and c_pct >= s1["min_confidence"] and lift >= s1["min_lift"]:
        return "L1"

    s2 = SIMPLE_THRESHOLDS["medium_rules"]
    if support >= s2["min_support"] and c_pct >= s2["min_confidence"] and lift >= s2["min_lift"]:
        return "L2"

    s3 = SIMPLE_THRESHOLDS["weak_rules"]
    if support >= s3["min_support"] and c_pct >= s3["min_confidence"] and lift >= s3["min_lift"]:
        return "L3"

    return "L4"

def get_rules_summary():
    transactions = load_transactions()
    n_tx = len(transactions)
    if n_tx == 0:
        return [], [], []

    # 1-项集计数 / Count 1-itemsets
    item_counter = Counter()
    pair_counter = Counter()

    for basket in transactions:
        for item in basket:
            item_counter[item] += 1
        for a, b in combinations(sorted(basket), 2):
            pair_counter[(a, b)] += 1

    frequent_1 = [
        {"item": k, "count": int(v), "support": v / n_tx}
        for k, v in item_counter.items()
        if v / n_tx >= MIN_SUPPORT_ITEMSET
    ]
    frequent_1.sort(key=lambda x: x["support"], reverse=True)

    # 注意：这里不用 key 名称 "items"，避免在 Jinja 中与 dict.items 冲突 / Avoid key name "items" to prevent Jinja dict.items collision
    frequent_2 = [
        {"pair": (a, b), "count": int(c), "support": c / n_tx}
        for (a, b), c in pair_counter.items()
        if c / n_tx >= MIN_SUPPORT_ITEMSET
    ]
    frequent_2.sort(key=lambda x: x["support"], reverse=True)

    # 生成规则 A→B / Generate directed rule A->B
    rules = []
    for (a, b), c_ab in pair_counter.items():
        support_ab = c_ab / n_tx
        if support_ab < MIN_SUPPORT:
            continue
        support_a = item_counter[a] / n_tx
        support_b = item_counter[b] / n_tx

        conf_a_b = support_ab / support_a
        lift_a_b = conf_a_b / support_b
        if conf_a_b >= MIN_CONFIDENCE:
            level = _classify_rule_level(support_ab, conf_a_b, lift_a_b)
            rules.append({
                "lhs": a,
                "rhs": b,
                "count": int(c_ab),
                "support": support_ab,
                "confidence": conf_a_b,
                "lift": lift_a_b,
                "level": level,
            })

        conf_b_a = support_ab / support_b
        lift_b_a = conf_b_a / support_a
        if conf_b_a >= MIN_CONFIDENCE:
            level = _classify_rule_level(support_ab, conf_b_a, lift_b_a)
            rules.append({
                "lhs": b,
                "rhs": a,
                "count": int(c_ab),
                "support": support_ab,
                "confidence": conf_b_a,
                "lift": lift_b_a,
                "level": level,
            })

    rules.sort(key=lambda r: (r["confidence"], r["lift"]), reverse=True)
    return rules, frequent_1, frequent_2

def get_custom_recommend(selected_items, top_n=5):
    """给定用户已选商品，返回推荐组合（简单从 rules 里筛）。 Return recommendations by filtering generated rules."""
    rules, _, _ = get_rules_summary()
    score = Counter()
    selected_set = set(selected_items)

    for r in rules:
        if r["lhs"] in selected_set and r["rhs"] not in selected_set:
            score[r["rhs"]] += r["confidence"] * r["lift"]

    recs = [
        {"item": item, "score": sc}
        for item, sc in score.most_common(top_n)
    ]
    return recs