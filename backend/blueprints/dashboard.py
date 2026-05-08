# backend/blueprints/dashboard.py
from flask import Blueprint, render_template, redirect, url_for, session, request, jsonify
import datetime

bp = Blueprint("dashboard", __name__)

@bp.route("/")
def index():
    from db import get_conn
    conn = get_conn()
    with conn.cursor() as cur:
        # 最近 7 天收入（含今天） / Revenue in the last 7 days (including today)
        cur.execute("""
            SELECT IFNULL(SUM(paid_amount),0) AS today_revenue
            FROM orders
            WHERE paid_at >= CURDATE() - INTERVAL 6 DAY
              AND status IN ('paid','picked','done')
        """)
        today_revenue = cur.fetchone()["today_revenue"]

        # 最近 7 天顾客数（付费的顾客） / Paying customers in the last 7 days
        cur.execute("""
            SELECT COUNT(DISTINCT user_id) AS today_users
            FROM orders
            WHERE paid_at >= CURDATE() - INTERVAL 6 DAY
              AND status IN ('paid','picked','done')
        """)
        today_users = cur.fetchone()["today_users"]

        # 最近 7 天新顾客 / New customers in the last 7 days
        cur.execute("""
            SELECT COUNT(*) AS new_clients
            FROM users
            WHERE created_at >= CURDATE() - INTERVAL 6 DAY
        """)
        new_clients = cur.fetchone()["new_clients"]

        # 最近 7 天订单数 / Order count in the last 7 days
        cur.execute("""
            SELECT COUNT(*) AS order_count
            FROM orders
            WHERE created_at >= CURDATE() - INTERVAL 6 DAY
        """)
        order_count = cur.fetchone()["order_count"]

        # 按门店收入 / Revenue by store
        cur.execute("""
            SELECT s.name AS store_name,
                   IFNULL(SUM(o.paid_amount),0) AS revenue
            FROM stores s
            LEFT JOIN orders o
              ON o.store_id = s.id
             AND o.status IN ('paid','picked','done')
            GROUP BY s.id
            ORDER BY revenue DESC
        """)
        store_revenue = cur.fetchall()
        # 把 Decimal 转成 float，避免模板里 Decimal / float 报错 / Cast Decimal to float to avoid template type issues
        for row in store_revenue:
            row["revenue"] = float(row.get("revenue") or 0)
        # 预先在 Python 里算好最大门店收入 / Precompute max store revenue for rendering
        max_store_revenue = max((row["revenue"] for row in store_revenue), default=1.0) or 1.0

        # 最近 30 天收入曲线 / Revenue trend over the last 30 days
        cur.execute("""
            SELECT DATE(created_at) AS d,
                   SUM(paid_amount) AS revenue,
                   COUNT(*) AS order_cnt
            FROM orders
            WHERE created_at >= CURDATE() - INTERVAL 30 DAY
              AND status IN ('paid','picked','done')
            GROUP BY DATE(created_at)
            ORDER BY d
        """)
        daily = cur.fetchall()

    conn.close()
    return render_template(
        "dashboard.html",
        today_revenue=today_revenue,
        today_users=today_users,
        new_clients=new_clients,
        order_count=order_count,
        store_revenue=store_revenue,
        max_store_revenue=max_store_revenue,
        daily=daily,
    )


@bp.route("/tables")
def tables():
    return render_template("tables.html")


@bp.route("/tables/orders")
def tables_orders():
    """返回某一天的订单列表，用于 Tables 页的 Order Table。 Return daily order rows for the Tables page."""
    from db import get_conn

    date_str = request.args.get("date")
    try:
        if date_str:
            q_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            q_date = datetime.date.today()
    except ValueError:
        q_date = datetime.date.today()

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
              o.order_no,
              o.user_id,
              o.paid_amount,
              s.name AS store_name,
              o.paid_at,
              o.status
            FROM orders o
            LEFT JOIN stores s ON s.id = o.store_id
            WHERE DATE(o.paid_at) = %s
              AND o.status IN ('paid','picked','done')
            ORDER BY o.paid_at
            """,
            (q_date,),
        )
        rows = cur.fetchall()
    conn.close()

    result = []
    for r in rows:
        paid_at = r.get("paid_at")
        result.append(
            {
                "order_no": r.get("order_no"),
                "user_id": r.get("user_id"),
                "amount": float(r.get("paid_amount") or 0),
                "store": r.get("store_name"),
                "time": paid_at.strftime("%Y-%m-%d %H:%M") if paid_at else "",
                "status": r.get("status"),
            }
        )

    return jsonify(result)


@bp.route("/incomes")
def incomes():
    from db import get_conn

    CLOSING_HOUR = 20  # 20:00 结业，之后不再计入当日营收 / Close at 20:00; later orders are excluded from today revenue

    conn = get_conn()
    with conn.cursor() as cur:
        # BEST SCORE：历史中月销量（订单数）最高的那一月 / Best-score month with highest historical order volume
        cur.execute("""
            SELECT
                YEAR(paid_at) AS y,
                MONTH(paid_at) AS m,
                COUNT(*) AS cnt
            FROM orders
            WHERE status IN ('paid','picked','done') AND paid_at IS NOT NULL
            GROUP BY YEAR(paid_at), MONTH(paid_at)
            ORDER BY cnt DESC
            LIMIT 1
        """)
        best = cur.fetchone()
        if best:
            best_score_volume = int(best["cnt"] or 0)
            best_score_y = best.get("y")
            best_score_m = best.get("m")
        else:
            best_score_volume = 0
            best_score_y = best_score_m = None

        # 今日订单与营收（若已过结业时间则只计到 20:00 为止） / Today orders and revenue (cap at 20:00 after closing)
        now = datetime.datetime.now()
        is_after_closing = now.hour >= CLOSING_HOUR
        if is_after_closing:
            cur.execute("""
                SELECT order_no, paid_amount, paid_at
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                  AND TIME(paid_at) <= %s
                ORDER BY paid_at DESC
                LIMIT 50
            """, (datetime.time(CLOSING_HOUR, 0, 0),))
        else:
            cur.execute("""
                SELECT order_no, paid_amount, paid_at
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                ORDER BY paid_at DESC
                LIMIT 50
            """)
        today_orders = cur.fetchall()
        if is_after_closing:
            cur.execute("""
                SELECT IFNULL(SUM(paid_amount), 0) AS total
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                  AND TIME(paid_at) <= %s
            """, (datetime.time(CLOSING_HOUR, 0, 0),))
        else:
            cur.execute("""
                SELECT IFNULL(SUM(paid_amount), 0) AS total
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
            """)
        today_revenue = float(cur.fetchone()["total"] or 0)

        # 当月累计营收（INCOME 卡片用） / Current month accumulated revenue for INCOME card
        cur.execute("""
            SELECT IFNULL(SUM(paid_amount), 0) AS total
            FROM orders
            WHERE status IN ('paid','picked','done') AND paid_at IS NOT NULL
              AND YEAR(paid_at) = YEAR(CURDATE()) AND MONTH(paid_at) = MONTH(CURDATE())
        """)
        month_revenue = float(cur.fetchone()["total"] or 0)
    conn.close()

    today_revenue_formatted = "{:,.2f}".format(today_revenue)
    month_revenue_formatted = "{:,.2f}".format(month_revenue)

    # 格式化 BEST SCORE 日期：英文月份，格式 "01 February 2023" / Format BEST SCORE date using English month names
    best_score_date = "—"
    if best_score_y is not None and best_score_m is not None:
        try:
            from calendar import month_name
            best_score_date = "01 {} {}".format(month_name[int(best_score_m)], int(best_score_y))
        except (ValueError, KeyError, IndexError):
            best_score_date = "{}-{:02d}".format(int(best_score_y), int(best_score_m))

    best_score_volume_formatted = "{:,}".format(best_score_volume)

    return render_template(
        "incomes.html",
        best_score_volume=best_score_volume,
        best_score_volume_formatted=best_score_volume_formatted,
        best_score_date=best_score_date,
        today_orders=today_orders,
        today_revenue=today_revenue,
        today_revenue_formatted=today_revenue_formatted,
        month_revenue=month_revenue,
        month_revenue_formatted=month_revenue_formatted,
        is_after_closing=is_after_closing,
    )


@bp.route("/incomes/today")
def incomes_today():
    """供 Incomes 页 TODAY REAL-TIME 轮询：当天订单列表与营收，结业后只计到 20:00。 Endpoint for TODAY REAL-TIME polling in Incomes page."""
    from db import get_conn

    CLOSING_HOUR = 20
    now = datetime.datetime.now()
    is_after_closing = now.hour >= CLOSING_HOUR

    conn = get_conn()
    with conn.cursor() as cur:
        if is_after_closing:
            cur.execute("""
                SELECT order_no, paid_amount, paid_at
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                  AND TIME(paid_at) <= %s
                ORDER BY paid_at DESC
                LIMIT 50
            """, (datetime.time(CLOSING_HOUR, 0, 0),))
        else:
            cur.execute("""
                SELECT order_no, paid_amount, paid_at
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                ORDER BY paid_at DESC
                LIMIT 50
            """)
        rows = cur.fetchall()
        if is_after_closing:
            cur.execute("""
                SELECT IFNULL(SUM(paid_amount), 0) AS total
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
                  AND TIME(paid_at) <= %s
            """, (datetime.time(CLOSING_HOUR, 0, 0),))
        else:
            cur.execute("""
                SELECT IFNULL(SUM(paid_amount), 0) AS total
                FROM orders
                WHERE DATE(paid_at) = CURDATE()
                  AND status IN ('paid','picked','done')
            """)
        total = float(cur.fetchone()["total"] or 0)

        # 当月累计营收（供 INCOME 卡片实时更新） / Monthly accumulated revenue for realtime INCOME updates
        cur.execute("""
            SELECT IFNULL(SUM(paid_amount), 0) AS total
            FROM orders
            WHERE status IN ('paid','picked','done') AND paid_at IS NOT NULL
              AND YEAR(paid_at) = YEAR(CURDATE()) AND MONTH(paid_at) = MONTH(CURDATE())
        """)
        month_revenue = float(cur.fetchone()["total"] or 0)
    conn.close()

    result = {
        "orders": [
            {
                "order_no": r["order_no"],
                "amount": float(r["paid_amount"] or 0),
                "time": r["paid_at"].strftime("%H:%M") if r.get("paid_at") else "",
            }
            for r in rows
        ],
        "total_revenue": total,
        "month_revenue": month_revenue,
        "is_after_closing": is_after_closing,
    }
    return jsonify(result)


@bp.route("/store")
def store():
    # 营业时间：周一至周六 09:00–20:00（20:00 视为已打烊） / Business hours: Mon-Sat 09:00-20:00 (closed at 20:00)
    now = datetime.datetime.now()
    is_open = (now.weekday() < 6 and 9 <= now.hour < 20)
    return render_template("store.html", is_open=is_open)


# 单一账号（不使用数据库） / Single hardcoded account (no DB auth)
LOGIN_USERNAME = "admin"
LOGIN_PASSWORD = "admin"


def login_required(f):
    """要求已登录，未登录则重定向到登录页。 Require login; redirect unauthenticated users to login page."""
    from functools import wraps
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("dashboard.login"))
        return f(*args, **kwargs)
    return wrapped


@bp.route("/login", methods=["GET", "POST"])
def login():
    if session.get("logged_in"):
        return redirect(url_for("dashboard.index"))
    if request.method == "POST":
        username = (request.form.get("username") or "").strip()
        password = (request.form.get("password") or "").strip()
        if username == LOGIN_USERNAME and password == LOGIN_PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("dashboard.index"))
        return render_template("login.html", error="账号或密码错误 / Invalid username or password")
    return render_template("login.html")


@bp.route("/logout")
def logout():
    session.pop("logged_in", None)
    session.pop("admin_logged", None)
    return redirect(url_for("dashboard.login"))