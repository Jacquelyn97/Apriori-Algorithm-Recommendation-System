from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any

import random

from flask import Blueprint, jsonify, request

from db import get_conn


bp = Blueprint("miniapp_api", __name__)

# 将微信小程序所有下单绑定到已有用户（不做微信登录流程）
# 使用 id 1~87 其中一位，而不是新增 wx_demo_user
MINIAPP_USER_ID_MIN = 1
MINIAPP_USER_ID_MAX = 87

# 小程序门店 id -> DB stores.code
STORE_CODE_MAP = {
    "kuchai": "kuchai",
    "cheras": "cheras",
    "sri-petaling": "sri_petal",
    "sri_petal": "sri_petal",
    "sri": "sri_petal",
}


def _gen_order_no(now: datetime.datetime) -> str:
    """
    订单号格式与项目其它订单一致：
    ORD + YYYYMMDDHHMM + 字母 + 数字

    示例：ORD202603121438E123
    """
    # 与既有订单一致（到分钟 + 3 位）
    return "ORD{}E{:03d}".format(now.strftime("%Y%m%d%H%M"), random.randint(0, 999))


def _status_to_cn(status: str | None) -> str:
    s = (status or "").strip()
    if s == "pending_pay":
        return "待支付"
    if s in ("paid", "picked"):
        return "待取餐"
    if s == "done":
        return "已完成"
    return s or "待取餐"


def _status_to_db(cn: str | None) -> str:
    s = (cn or "").strip()
    if s in ("待支付", "pending_pay"):
        return "pending_pay"
    if s in ("已完成", "done"):
        return "done"
    if s in ("待取餐", "paid", "picked"):
        return "paid"
    return "paid"


def _parse_dt(v) -> str:
    if v is None:
        return ""
    try:
        return v.isoformat()
    except Exception:
        return str(v)


def _base_product_name(name: str) -> str:
    """
    小程序下单商品名可能带选项，如：奥利奥脆脆奶茶（正常冰 / 半糖）
    数据库里是基础名：奥利奥脆脆奶茶
    这里做容错：优先截断中文括号内容。
    """
    if not name:
        return ""
    s = str(name).strip()
    if "（" in s:
        s = s.split("（", 1)[0].strip()
    if "(" in s:
        s = s.split("(", 1)[0].strip()
    return s


def _pick_existing_miniapp_user_id() -> int:
    """
    选择一个已存在的用户（id 1~87 之间）。
    若范围内不存在，则退化为选择最小 id 的用户。
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id
                FROM users
                WHERE id BETWEEN %s AND %s
                ORDER BY id
                """,
                (MINIAPP_USER_ID_MIN, MINIAPP_USER_ID_MAX),
            )
            rows = cur.fetchall() or []
            if rows:
                # 固定选择其中一位（避免每次下单都变成不同用户导致报表不稳定）
                return int(rows[0]["id"])

            cur.execute("SELECT id FROM users ORDER BY id LIMIT 1")
            r = cur.fetchone()
            if r and r.get("id"):
                return int(r["id"])
    finally:
        conn.close()
    raise RuntimeError("No users found in database.")


def _get_store_id(store_key: str | None) -> int | None:
    if not store_key:
        return None
    code = STORE_CODE_MAP.get(store_key, store_key)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM stores WHERE code = %s LIMIT 1", (code,))
            r = cur.fetchone()
            return int(r["id"]) if r and r.get("id") else None
    finally:
        conn.close()


@bp.route("/menu", methods=["GET"])
def menu():
    """返回小程序菜单（来自 DB products + categories）。"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  p.id,
                  p.name,
                  p.base_price AS price,
                  p.image_url,
                  c.name AS category
                FROM products p
                LEFT JOIN product_categories c ON c.id = p.category_id
                WHERE p.is_active = 1
                ORDER BY c.display_order, p.id
                """
            )
            rows = cur.fetchall() or []
        return jsonify(
            [
                {
                    "id": int(r["id"]),
                    "name": r.get("name"),
                    "price": float(r.get("price") or 0),
                    "image_url": r.get("image_url"),
                    "category": r.get("category"),
                }
                for r in rows
            ]
        )
    finally:
        conn.close()


@bp.route("/order", methods=["POST"])
def create_order():
    """
    小程序下单写入数据库：
    写 orders / order_items，若 delivery 则写 order_delivery_info。
    """
    payload: dict[str, Any] = request.get_json(silent=True) or {}
    delivery_mode = (payload.get("deliveryMode") or "self").strip()  # self/delivery
    store_key = payload.get("storeId") or payload.get("pickupStoreId") or payload.get("store_code")
    items = payload.get("items") or []
    address = payload.get("address") or None
    status_in = (payload.get("status") or "").strip()

    if not isinstance(items, list) or not items:
        return jsonify({"ok": False, "error": "items is required"}), 400

    user_id = _pick_existing_miniapp_user_id()
    store_id = _get_store_id(str(store_key)) if delivery_mode != "delivery" else _get_store_id(str(store_key or "kuchai"))
    if not store_id:
        store_id = _get_store_id("kuchai")

    db_status = _status_to_db(status_in)

    now = datetime.datetime.now()
    created_at = now
    paid_at = now + datetime.timedelta(minutes=1) if db_status in ("paid", "picked", "done") else None
    finished_at = (paid_at or created_at) + datetime.timedelta(minutes=10) if db_status in ("picked", "done") else None

    # 从 DB 按商品名解析 product_id / price，避免仅依赖前端价格
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            product_names = []
            normalized_items = []
            for it in items:
                raw_name = (it.get("name") or "").strip()
                base_name = _base_product_name(raw_name)
                if not raw_name and not base_name:
                    continue
                qty = int(it.get("qty") or 1)
                qty = max(1, min(qty, 20))
                # 先尝试原始名称（可能本身就是 DB 商品名，如：甜甜圈（草莓樱花））
                if raw_name:
                    product_names.append(raw_name)
                # 再尝试基础名称（去掉选项，如：奥利奥脆脆奶茶（正常冰/半糖）-> 奥利奥脆脆奶茶）
                if base_name and base_name != raw_name:
                    product_names.append(base_name)
                normalized_items.append(
                    {"raw_name": raw_name, "base_name": base_name, "qty": qty}
                )

            if not normalized_items:
                return jsonify({"ok": False, "error": "invalid items"}), 400

            # 去重，避免 IN 参数过长
            uniq_names = list(dict.fromkeys([n for n in product_names if n]))
            placeholders = ",".join(["%s"] * len(uniq_names))
            cur.execute(
                f"""
                SELECT id, name, base_price
                FROM products
                WHERE name IN ({placeholders})
                """,
                uniq_names,
            )
            prod_rows = cur.fetchall() or []
            by_name = {r["name"]: r for r in prod_rows}

            total_amount = Decimal("0.00")
            item_rows = []
            for it in normalized_items:
                p = by_name.get(it["raw_name"]) or by_name.get(it["base_name"])
                if not p:
                    return jsonify({"ok": False, "error": f"product not found: {it['raw_name']}"}), 400
                unit_price = Decimal(str(p.get("base_price") or 0))
                qty = int(it["qty"])
                line_total = unit_price * qty
                total_amount += line_total
                item_rows.append(
                    {
                        "product_id": int(p["id"]),
                        # 快照保留小程序原始名称（含选项），便于前端/报表展示
                        "product_name_snap": it["raw_name"],
                        "unit_price": unit_price,
                        "qty": qty,
                        "line_total": line_total,
                    }
                )

            discount = Decimal("0.00")
            if total_amount >= Decimal("80.00"):
                discount = Decimal("20.00")
            payable = max(total_amount - discount, Decimal("0.00"))
            paid_amount = payable if db_status != "pending_pay" else Decimal("0.00")
            payment_method = (payload.get("paymentMethod") or "TNG").strip() or "TNG"

            # 订单号格式：与项目其它订单一致（ORDYYYYMMDDHHMME###）
            # 为避免极小概率重复，这里最多重试几次
            order_no = _gen_order_no(now)
            for _ in range(5):
                cur.execute("SELECT 1 FROM orders WHERE order_no=%s LIMIT 1", (order_no,))
                if not cur.fetchone():
                    break
                order_no = _gen_order_no(now)

            cur.execute(
                """
                INSERT INTO orders
                (order_no, user_id, store_id, delivery_mode, status,
                 total_amount, discount_amount, payable_amount, paid_amount,
                 payment_method, created_at, paid_at, finished_at)
                VALUES
                (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    order_no,
                    user_id,
                    store_id,
                    delivery_mode,
                    db_status,
                    total_amount,
                    discount,
                    payable,
                    paid_amount,
                    payment_method,
                    created_at,
                    paid_at,
                    finished_at,
                ),
            )
            order_id = int(cur.lastrowid)

            cur.executemany(
                """
                INSERT INTO order_items
                (order_id, product_id, product_variant_id, product_name_snap,
                 unit_price, qty, line_total)
                VALUES (%s,%s,NULL,%s,%s,%s,%s)
                """,
                [
                    (
                        order_id,
                        r["product_id"],
                        r["product_name_snap"],
                        r["unit_price"],
                        r["qty"],
                        r["line_total"],
                    )
                    for r in item_rows
                ],
            )

            if delivery_mode == "delivery" and address:
                detail = (address.get("detail") or "").strip()
                receiver_name = (address.get("name") or "").strip()
                phone = (address.get("phone") or "").strip()
                postcode = None
                if detail:
                    parts = detail.split()
                    if len(parts) >= 3:
                        postcode = parts[-3]
                cur.execute(
                    """
                    INSERT INTO order_delivery_info
                    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (order_id, receiver_name, phone, detail, postcode, None, None),
                )

        conn.commit()
        return jsonify(
            {
                "ok": True,
                "order_no": order_no,
                "order_id": order_id,
                "status": db_status,
                "payable_amount": float(payable),
            }
        )
    finally:
        conn.close()


@bp.route("/orders", methods=["GET"])
def list_orders():
    """从数据库返回该小程序绑定用户的订单列表（用于小程序订单页持久化显示）。"""
    user_id = _pick_existing_miniapp_user_id()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  o.id,
                  o.order_no,
                  o.delivery_mode,
                  o.status,
                  o.payable_amount,
                  o.created_at,
                  s.code AS store_code
                FROM orders o
                LEFT JOIN stores s ON s.id = o.store_id
                WHERE o.user_id = %s
                ORDER BY o.created_at DESC
                LIMIT 200
                """,
                (user_id,),
            )
            orders = cur.fetchall() or []
            if not orders:
                return jsonify({"ok": True, "orders": []})

            order_ids = [int(r["id"]) for r in orders]
            placeholders = ",".join(["%s"] * len(order_ids))
            cur.execute(
                f"""
                SELECT
                  oi.order_id,
                  oi.product_name_snap,
                  oi.unit_price,
                  oi.qty
                FROM order_items oi
                WHERE oi.order_id IN ({placeholders})
                ORDER BY oi.id
                """,
                order_ids,
            )
            items = cur.fetchall() or []

        by_order = {}
        for it in items:
            oid = int(it["order_id"])
            by_order.setdefault(oid, []).append(
                {
                    "name": it.get("product_name_snap") or "",
                    "price": float(it.get("unit_price") or 0),
                    "qty": int(it.get("qty") or 0),
                    "image": None,
                }
            )

        out = []
        for o in orders:
            oid = int(o["id"])
            out.append(
                {
                    "id": o.get("order_no"),
                    "createTime": _parse_dt(o.get("created_at")),
                    "status": _status_to_cn(o.get("status")),
                    "deliveryMode": o.get("delivery_mode") or "self",
                    "store": {"id": o.get("store_code") or ""} if o.get("store_code") else None,
                    "items": by_order.get(oid, []),
                    "totalPrice": float(o.get("payable_amount") or 0),
                }
            )
        return jsonify({"ok": True, "orders": out})
    finally:
        conn.close()


@bp.route("/order/confirm", methods=["POST"])
def confirm_order():
    """确认取餐：将订单状态更新为 done。"""
    payload: dict[str, Any] = request.get_json(silent=True) or {}
    order_no = (payload.get("order_no") or payload.get("orderNo") or "").strip()
    if not order_no:
        return jsonify({"ok": False, "error": "order_no is required"}), 400

    now = datetime.datetime.now()
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, status FROM orders WHERE order_no=%s LIMIT 1", (order_no,))
            row = cur.fetchone()
            if not row:
                return jsonify({"ok": False, "error": "order not found"}), 404

            cur.execute(
                "UPDATE orders SET status='done', finished_at=%s WHERE id=%s",
                (now, row["id"]),
            )
        conn.commit()
        return jsonify({"ok": True, "order_no": order_no, "status": "done"})
    finally:
        conn.close()


@bp.route("/order/pay", methods=["POST"])
def pay_order():
    """
    小程序“待支付 -> 已支付”时，更新同一笔订单（不更换 order_no）。
    """
    payload: dict[str, Any] = request.get_json(silent=True) or {}
    order_no = (payload.get("order_no") or payload.get("orderNo") or "").strip()
    payment_method = (payload.get("paymentMethod") or "TNG").strip() or "TNG"
    if not order_no:
        return jsonify({"ok": False, "error": "order_no is required"}), 400

    now = datetime.datetime.now()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, payable_amount, status FROM orders WHERE order_no=%s LIMIT 1",
                (order_no,),
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"ok": False, "error": "order not found"}), 404

            # 只允许从 pending_pay 变为 paid（避免覆盖其它状态）
            if row.get("status") != "pending_pay":
                return jsonify({"ok": False, "error": f"invalid status: {row.get('status')}"}), 400

            payable = row.get("payable_amount") or 0
            cur.execute(
                """
                UPDATE orders
                SET status='paid',
                    paid_amount=%s,
                    paid_at=%s,
                    payment_method=%s
                WHERE id=%s
                """,
                (payable, now, payment_method, row["id"]),
            )

        conn.commit()
        return jsonify({"ok": True, "order_no": order_no, "status": "paid"})
    finally:
        conn.close()

