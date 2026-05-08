# backend/services/clustering.py
"""
用户分群-聚类分析：RFM K-Means、群体特征、迁移桑基图数据。
Customer segmentation via RFM K-Means, cohort features, and migration Sankey data.
"""
from collections import Counter, defaultdict
from db import get_conn

# 分析窗口：最近 N 天内的订单参与 RFM 计算 / Analysis window: orders in recent N days are used for RFM
RFM_DAYS = 365
# 迁移对比：当前期最近 30 天，上期 30–60 天前 / Migration comparison: current 30 days vs previous 30-60 days
MIGRATION_CURRENT_DAYS = 30
MIGRATION_PREVIOUS_DAYS = 30
N_CLUSTERS = 5

# 五群名称（按 K-Means 聚类后按 R 升序、M 降序排序后依次对应 0..4） / Segment names mapped to sorted centroids
SEGMENT_NAMES = [
    "高价值忠诚群",
    "新锐潜力群",
    "价格敏感群",
    "高价值流失群",
    "沉睡流失群",
]


def _get_rfm_sql(end_days_ago, start_days_ago):
    """RFM 统计时间范围：[CURDATE()-end_days_ago, CURDATE()-start_days_ago)。 RFM time window definition."""
    return """
        SELECT
          u.id AS user_id,
          DATEDIFF(CURDATE(), MAX(o.created_at)) AS R,
          COUNT(o.id) AS F,
          IFNULL(SUM(o.paid_amount), 0) AS M
        FROM users u
        INNER JOIN orders o ON o.user_id = u.id
          AND o.status IN ('paid','picked','done')
          AND o.paid_at IS NOT NULL
          AND o.created_at >= CURDATE() - INTERVAL %s DAY
          AND o.created_at < CURDATE() - INTERVAL %s DAY
        GROUP BY u.id
    """


def _run_kmeans_and_label(rfm_list):
    """对 RFM 列表做 K-Means，返回 (labels, centroids, segment_names_for_index)。 Run K-Means and return labels/centroids/segment names."""
    if not rfm_list or len(rfm_list) < N_CLUSTERS:
        return [], [], []
    try:
        import numpy as np
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        # 无 sklearn 时退回规则分群 / Fallback to rule-based segmentation when sklearn is unavailable
        labels = []
        for r in rfm_list:
            r_val = r["R"] or 999
            f_val = r["F"] or 0
            m_val = float(r["M"] or 0)
            if r_val <= 30 and m_val >= 150:
                labels.append(0)
            elif r_val <= 60 and m_val >= 50:
                labels.append(1)
            elif f_val >= 5 and m_val < 80:
                labels.append(2)
            elif r_val > 90 and m_val >= 100:
                labels.append(3)
            else:
                labels.append(4)
        centroids = None
        return labels, centroids, SEGMENT_NAMES

    X = np.array([[r["R"] or 999, r["F"] or 0, float(r["M"] or 0)] for r in rfm_list])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    # 按 R 升序、M 降序排中心，使 centroid 0=高价值忠诚，4=沉睡流失 / Sort centroids by low R and high M for stable segment indexing
    idx = np.lexsort((-centroids[:, 2], -centroids[:, 1], centroids[:, 0]))
    centroids_sorted = centroids[idx]
    inv_map = {idx[i]: i for i in range(N_CLUSTERS)}
    new_labels = np.array([inv_map[labels[j]] for j in range(len(labels))])
    return new_labels, centroids_sorted, SEGMENT_NAMES


def _get_user_category_and_hour(conn):
    """返回 (user_id -> top_category, user_id -> top_time_bucket)。 Return user-level favorite category and preferred time bucket."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT o.user_id, c.name AS cat_name, COUNT(*) AS cnt
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            JOIN product_categories c ON c.id = p.category_id
            WHERE o.status IN ('paid','picked','done') AND o.paid_at IS NOT NULL
              AND o.created_at >= CURDATE() - INTERVAL %s DAY
            GROUP BY o.user_id, c.name
        """, (RFM_DAYS,))
        rows = cur.fetchall()
    # user_id -> { cat_name: count }
    by_user = defaultdict(Counter)
    for r in rows:
        by_user[r["user_id"]][r["cat_name"]] += r["cnt"]
    top_cat = {uid: cnt.most_common(1)[0][0] if cnt else "—" for uid, cnt in by_user.items()}

    with conn.cursor() as cur:
        cur.execute("""
            SELECT user_id, HOUR(created_at) AS h, COUNT(*) AS cnt
            FROM orders
            WHERE status IN ('paid','picked','done') AND paid_at IS NOT NULL
              AND created_at >= CURDATE() - INTERVAL %s DAY
            GROUP BY user_id, HOUR(created_at)
        """, (RFM_DAYS,))
        rows = cur.fetchall()
    # 时段：上午 6-11, 下午茶 12-16, 晚间 17-22 / Time buckets: morning 6-11, afternoon 12-16, evening 17-22
    def bucket(h):
        if 6 <= h < 12:
            return "上午"
        if 12 <= h < 17:
            return "下午茶"
        if 17 <= h < 23:
            return "晚间"
        return "其他"
    by_user_h = defaultdict(Counter)
    for r in rows:
        by_user_h[r["user_id"]][bucket(r["h"])] += r["cnt"]
    top_hour = {uid: cnt.most_common(1)[0][0] if cnt else "—" for uid, cnt in by_user_h.items()}
    return top_cat, top_hour


def get_cluster_summary():
    """返回 (summary_list, rfm_points, radar_datasets, migration_links)。 Return summary, scatter points, radar datasets, and migration links."""
    conn = get_conn()
    with conn.cursor() as cur:
        # 最近 RFM_DAYS 天：end=RFM_DAYS, start=0 / Current RFM window setup
        cur.execute(
            _get_rfm_sql(RFM_DAYS, 0),
            (RFM_DAYS, 0),
        )
        rfm_list = list(cur.fetchall())
    top_cat, top_hour = _get_user_category_and_hour(conn)

    if not rfm_list:
        return [], [], [], []

    labels, centroids, names = _run_kmeans_and_label(rfm_list)
    for i, r in enumerate(rfm_list):
        r["cluster_idx"] = labels[i] if i < len(labels) else 0
        r["segment"] = names[r["cluster_idx"]]

    total_users = len(rfm_list)
    rfm_points = []
    for r in rfm_list:
        rfm_points.append({
            "x": r["R"] if r["R"] is not None else 999,
            "y": float(r["M"] or 0),
            "f": r["F"],
            "segment": r["segment"],
            "cluster_idx": r["cluster_idx"],
        })

    # 群体消费特征：人数、占比、客单价、复购率、最爱品类、最爱时段 / Cohort metrics: size, share, avg order value, repurchase, favorite category/time
    seg_users = defaultdict(list)
    for r in rfm_list:
        seg_users[r["segment"]].append(r)
    summary_list = []
    for seg in names:
        users = seg_users.get(seg, [])
        cnt = len(users)
        if cnt == 0:
            summary_list.append({
                "segment": seg,
                "cnt": 0,
                "pct": 0,
                "avg_order_amount": 0,
                "repurchase_rate": 0,
                "favorite_category": "—",
                "favorite_timeslot": "—",
            })
            continue
        total_m = sum(float(u["M"] or 0) for u in users)
        total_f = sum(u["F"] or 0 for u in users)
        avg_order_amount = total_m / total_f if total_f else 0
        repurchase_count = sum(1 for u in users if (u["F"] or 0) >= 2)
        repurchase_rate = (repurchase_count / cnt * 100) if cnt else 0
        cat_counter = Counter()
        hour_counter = Counter()
        for u in users:
            uid = u["user_id"]
            if uid in top_cat:
                cat_counter[top_cat[uid]] += 1
            if uid in top_hour:
                hour_counter[top_hour[uid]] += 1
        fav_cat = cat_counter.most_common(1)[0][0] if cat_counter else "—"
        fav_hour = hour_counter.most_common(1)[0][0] if hour_counter else "—"
        summary_list.append({
            "segment": seg,
            "cnt": cnt,
            "pct": round(cnt / total_users * 100, 1),
            "avg_order_amount": round(avg_order_amount, 1),
            "repurchase_rate": round(repurchase_rate, 1),
            "favorite_category": fav_cat,
            "favorite_timeslot": fav_hour,
        })

    # 雷达图：每群一条线，维度 消费频率(F)、客单价(M)、品类偏好(0-100)、活跃时段(0-100) / Radar chart dimensions per segment
    f_max = max((r["F"] or 0) for r in rfm_list) or 1
    m_max = max((float(r["M"] or 0) for r in rfm_list)) or 1
    radar_datasets = []
    colors = ["#7928ca", "#0e7490", "#65a30d", "#ea580c", "#9f1239"]
    for idx, seg in enumerate(names):
        users = seg_users.get(seg, [])
        if not users:
            radar_datasets.append({"segment": seg, "values": [0, 0, 50, 50], "color": colors[idx % len(colors)]})
            continue
        avg_f = sum(u["F"] or 0 for u in users) / len(users)
        avg_m = sum(float(u["M"] or 0) for u in users) / len(users)
        cat_score = 50
        hour_score = 50
        if users:
            uid_list = [u["user_id"] for u in users]
            cat_counter = Counter(top_cat.get(uid, "—") for uid in uid_list)
            hour_counter = Counter(top_hour.get(uid, "—") for uid in uid_list)
            if cat_counter:
                top = cat_counter.most_common(1)[0][1]
                cat_score = min(100, 50 + top * 5)
            if hour_counter:
                top = hour_counter.most_common(1)[0][1]
                hour_score = min(100, 50 + top * 5)
        radar_datasets.append({
            "segment": seg,
            "values": [
                round(min(100, avg_f / f_max * 100), 1),
                round(min(100, avg_m / m_max * 100), 1),
                cat_score,
                hour_score,
            ],
            "color": colors[idx % len(colors)],
        })

    # 迁移桑基图：上期(30–60天前) -> 本期(最近30天) 流量，仅统计两期都有订单的用户 / Migration Sankey links for users active in both periods
    migration_links = []
    try:
        with conn.cursor() as cur:
            cur.execute(_get_rfm_sql(30, 0), (30, 0))
            current_rfm = list(cur.fetchall())
            cur.execute(_get_rfm_sql(60, 30), (60, 30))
            prev_rfm = list(cur.fetchall())
        prev_by_uid = {r["user_id"]: r for r in prev_rfm}
        cur_by_uid = {r["user_id"]: r for r in current_rfm}
        common_uids = set(prev_by_uid.keys()) & set(cur_by_uid.keys())
        if len(common_uids) >= N_CLUSTERS and current_rfm:
            labels_cur, centroids, _ = _run_kmeans_and_label(current_rfm)
            cur_seg = {}
            for i, r in enumerate(current_rfm):
                cur_seg[r["user_id"]] = names[labels_cur[i]] if i < len(labels_cur) else names[0]
            import numpy as np
            prev_list = [prev_by_uid[uid] for uid in common_uids]
            X_prev = np.array([[r["R"] or 999, r["F"] or 0, float(r["M"] or 0)] for r in prev_list])
            if centroids is not None and len(centroids) == N_CLUSTERS:
                dist = np.zeros((len(prev_list), N_CLUSTERS))
                for k in range(N_CLUSTERS):
                    dist[:, k] = np.sqrt(np.sum((X_prev - centroids[k]) ** 2, axis=1))
                prev_labels = np.argmin(dist, axis=1)
                for i, uid in enumerate(common_uids):
                    prev_seg_name = names[prev_labels[i]]
                    cur_seg_name = cur_seg.get(uid, names[0])
                    migration_links.append({
                        "from": prev_seg_name,
                        "to": cur_seg_name,
                        "value": 1,
                    })
                # 合并相同 (from, to) 的 value / Merge duplicate (from,to) flows
                from_to = Counter()
                for link in migration_links:
                    from_to[(link["from"], link["to"])] += link["value"]
                migration_links = [{"from": f, "to": t, "value": v} for (f, t), v in from_to.items() if v > 0]
            else:
                migration_links = []
    except Exception:
        migration_links = []

    # 确保所有数值都是原生 Python int/float，方便 Jinja 的 tojson 序列化 / Cast to native int/float for Jinja tojson serialization
    for p in rfm_points:
        p["x"] = int(p.get("x") or 0)
        p["y"] = float(p.get("y") or 0.0)
        p["f"] = int(p.get("f") or 0)
        p["cluster_idx"] = int(p.get("cluster_idx") or 0)
    for s in summary_list:
        s["cnt"] = int(s.get("cnt") or 0)
        s["pct"] = float(s.get("pct") or 0.0)
        s["avg_order_amount"] = float(s.get("avg_order_amount") or 0.0)
        s["repurchase_rate"] = float(s.get("repurchase_rate") or 0.0)
    for d in radar_datasets:
        d["values"] = [float(v) for v in d.get("values", [])]
    for link in migration_links:
        link["value"] = int(link.get("value") or 0)

    conn.close()
    return summary_list, rfm_points, radar_datasets, migration_links
