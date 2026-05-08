# backend/blueprints/realtime_sales.py
from flask import Blueprint, render_template
from datetime import date
from db import get_conn

bp = Blueprint("realtime", __name__)

@bp.route("/")
def realtime_home():
    conn = get_conn()
    with conn.cursor() as cur:
        # 今日关键指标
        cur.execute("""
            SELECT
              IFNULL(SUM(paid_amount),0) AS revenue,
              COUNT(*) AS order_cnt,
              COUNT(DISTINCT user_id) AS user_cnt
            FROM orders
            WHERE DATE(paid_at) = CURDATE()
              AND status IN ('paid','picked','done')
        """)
        today = cur.fetchone()

        today_date = date.today()

        # 今日顾客增长 / 新客 vs 老客 / 复购
        cur.execute("""
            SELECT DISTINCT user_id
            FROM orders
            WHERE DATE(paid_at) = CURDATE()
              AND status IN ('paid','picked','done')
              AND paid_at IS NOT NULL
        """)
        today_users_rows = cur.fetchall()
        today_user_ids = [r["user_id"] for r in today_users_rows] if today_users_rows else []

        growth = {
            "today_users": len(today_user_ids),
            "new_users": 0,
            "returning_users": 0,
            "repeat_users_today": 0,
            "repeat_rate_today": 0.0,
        }

        if today_user_ids:
            placeholders = ",".join(["%s"] * len(today_user_ids))
            cur.execute(
                f"""
                SELECT user_id,
                       MIN(DATE(paid_at)) AS first_date,
                       COUNT(*) AS total_orders
                FROM orders
                WHERE status IN ('paid','picked','done')
                  AND paid_at IS NOT NULL
                  AND user_id IN ({placeholders})
                GROUP BY user_id
                """,
                today_user_ids,
            )
            rows = cur.fetchall()
            new_users = 0
            returning_users = 0
            repeat_today = 0
            for r in rows:
                first_date = r["first_date"]
                total_orders = r["total_orders"] or 0
                if first_date == today_date:
                    new_users += 1
                else:
                    returning_users += 1
                if total_orders >= 2:
                    repeat_today += 1
            growth["new_users"] = new_users
            growth["returning_users"] = returning_users
            growth["repeat_users_today"] = repeat_today
            growth["repeat_rate_today"] = (
                (repeat_today / len(today_user_ids)) * 100.0 if today_user_ids else 0.0
            )

        # 最近 14 天收入 & 订单数
        cur.execute("""
            SELECT DATE(created_at) AS d,
                   SUM(paid_amount) AS revenue,
                   COUNT(*) AS order_cnt
            FROM orders
            WHERE created_at >= CURDATE() - INTERVAL 14 DAY
              AND status IN ('paid','picked','done')
            GROUP BY DATE(created_at)
            ORDER BY d
        """)
        daily = cur.fetchall()

        # 今日 24 小时每小时订单（仅统计 09:00–20:00，下班时间视为 0）
        cur.execute("""
            SELECT HOUR(paid_at) AS h,
                   COUNT(*) AS cnt
            FROM orders
            WHERE DATE(paid_at) = CURDATE()
              AND status IN ('paid','picked','done')
              AND paid_at IS NOT NULL
              AND HOUR(paid_at) BETWEEN 9 AND 20
            GROUP BY HOUR(paid_at)
            ORDER BY h
        """)
        hourly_raw = cur.fetchall()
        # 补齐 0–23 点所有小时，即使没有订单也显示为 0；实际下单主要集中在 09–20 点
        hourly_map = {row["h"]: row["cnt"] for row in (hourly_raw or [])}
        hourly = [{"h": h, "cnt": hourly_map.get(h, 0)} for h in range(0, 24)]

        # 今日客单价分布
        cur.execute("""
            SELECT
              CASE
                WHEN payable_amount < 20 THEN '0-20'
                WHEN payable_amount < 40 THEN '21-40'
                WHEN payable_amount < 60 THEN '41-60'
                ELSE '61+'
              END AS bucket,
              COUNT(*) AS cnt
            FROM orders
            WHERE DATE(paid_at) = CURDATE()
              AND status IN ('paid','picked','done')
            GROUP BY bucket
            ORDER BY
              CASE bucket
                WHEN '0-20' THEN 1
                WHEN '21-40' THEN 2
                WHEN '41-60' THEN 3
                ELSE 4
              END
        """)
        price_buckets = cur.fetchall()

        # 类目销量占比
        cur.execute("""
            SELECT c.name AS category,
                   SUM(oi.qty) AS qty
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN product_categories c ON c.id = p.category_id
            GROUP BY c.id
        """)
        cat_share = cur.fetchall()

    conn.close()
    return render_template(
        "realtime_sales.html",
        today=today,
        daily=daily,
        hourly=hourly,
        growth=growth,
        price_buckets=price_buckets,
        cat_share=cat_share,
    )