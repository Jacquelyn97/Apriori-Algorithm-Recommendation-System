# backend/blueprints/gold_match.py
from flask import Blueprint, render_template, request, jsonify
from services.apriori import (
    get_rules_summary,
    get_custom_recommend,
    MIN_SUPPORT,
    MIN_CONFIDENCE,
    MIN_SUPPORT_ITEMSET,
)

bp = Blueprint("gold", __name__)

@bp.route("/")
def gold_home():
    rules, frequent_1, frequent_2 = get_rules_summary()
    # 这里做一些派生数据，供前端展示（图/卡片/列表） / Build derived datasets for charts/cards/lists
    # 规则本身已经在 services.apriori 里做过最低支持度 / 置信度过滤， / Base filtering is already handled in services.apriori,
    # 这里不过度再筛选，直接展示前 50 条，让数据更丰富。 / so we show top 50 directly for richer display.
    top_rules = rules[:50]
    top1 = frequent_1[:5]
    rest1 = frequent_1[5:50]
    top2 = frequent_2[:5]
    rest2 = frequent_2[5:50]

    # 关联网络图：取前 30 个 pair 当边 / Association graph: use top 30 pairs as edges
    graph_pairs = frequent_2[:30]
    nodes = {}
    edges = []
    for p in graph_pairs:
        a, b = p["pair"]
        nodes[a] = True
        nodes[b] = True
        edges.append({"source": a, "target": b, "support": p["support"], "count": p.get("count", 0)})
    # 若没有 pair，则用 Top 单品当节点（无连线） / If no pairs exist, use top single items as isolated nodes
    if not edges:
        for f in frequent_1[:12]:
            nodes[f["item"]] = True

    # 套餐建议卡：只使用 L1（strong_rules）等级的规则来生成 / Bundle cards prefer L1 rules
    # 如果没有任何 L1，则退而求其次，用其它规则里 lift*confidence 最高的几条 / Fallback to highest lift*confidence rules when no L1 exists
    bundles = []
    seen = set()

    strong_rules = [r for r in rules if r.get("level") == "L1"]
    source_rules = strong_rules if strong_rules else rules

    for r in sorted(source_rules, key=lambda x: (x.get("lift", 0) * x.get("confidence", 0)), reverse=True):
        key = (r["lhs"], r["rhs"])
        if key in seen:
            continue
        seen.add(key)
        bundles.append({
            "title": "黄金搭配套餐",
            "products": [r["lhs"], r["rhs"]],
            "support": r.get("support", 0),
            "confidence": r.get("confidence", 0),
            "lift": r.get("lift", 0),
            "level": r.get("level"),
        })
        if len(bundles) >= 3:
            break

    return render_template(
        "gold_match.html",
        rules=top_rules,
        frequent_1=frequent_1,
        frequent_2=frequent_2,
        top1=top1,
        rest1=rest1,
        top2=top2,
        rest2=rest2,
        graph_nodes=list(nodes.keys()),
        graph_edges=edges,
        bundles=bundles,
        min_support_rule=MIN_SUPPORT,
        min_confidence_rule=MIN_CONFIDENCE,
        min_support_itemset=MIN_SUPPORT_ITEMSET,
    )

@bp.route("/recommend", methods=["POST"])
def gold_recommend():
    data = request.get_json() or {}
    selected_items = data.get("items", [])
    recs = get_custom_recommend(selected_items)
    return jsonify(recs)