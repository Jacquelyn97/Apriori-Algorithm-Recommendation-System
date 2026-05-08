"""
每天手动运行一次，为「当天」生成一批订单（周一至周六 09:00–20:00 营业时间内）。
Run once per day to generate orders for today during business hours (Mon-Sat 09:00-20:00).
用法 / Usage：在 backend 目录下执行 python seed_today_orders.py
"""
import random
import datetime
from decimal import Decimal

from db import get_conn
from seed_data import (
    random_malaysia_address,
    _parse_city_from_address,
    _random_latlng_for_city,
    fake,
)

OPEN_CHERAS = datetime.date(2011, 5, 15)
OPEN_SRI = datetime.date(2015, 8, 12)
MIN_ORDERS = 20
MAX_ORDERS = 55


def main():
    today = datetime.date.today()
    if today.weekday() == 6:
        print("Today is Sunday, no orders generated.")
        return

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users")
            users = [r["id"] for r in cur.fetchall()]
            cur.execute("SELECT id, code FROM stores")
            store_rows = cur.fetchall()
            code_to_id = {r["code"]: r["id"] for r in store_rows}
            cur.execute("""
                SELECT p.id, p.base_price, p.name, c.name AS category_name
                FROM products p
                LEFT JOIN product_categories c ON c.id = p.category_id
                WHERE p.is_active = 1
            """)
            products = [
                (r["id"], r["base_price"], r["name"], r["category_name"])
                for r in cur.fetchall()
            ]

        if not users or not products:
            print("No users or products in DB. Skip.")
            return

        kuchai_id = code_to_id.get("kuchai")
        cheras_id = code_to_id.get("cheras")
        sri_id = code_to_id.get("sri_petal")
        candidates = [x for x in [kuchai_id, cheras_id, sri_id] if x]

        num_orders = random.randint(MIN_ORDERS, MAX_ORDERS)
        order_rows = []
        item_rows = []
        delivery_rows = []

        # 营业时间 09:00–19:59 内的随机分钟数 / Random minute offset within 09:00-19:59
        business_minutes_max = (20 - 9) * 60 - 1  # 659

        for _ in range(num_orders):
            user_id = random.choice(users)
            store_id = random.choice(candidates) if candidates else kuchai_id
            minutes_offset = random.randint(0, business_minutes_max)
            created_at = datetime.datetime.combine(
                today,
                datetime.time(9, 0, 0),
            ) + datetime.timedelta(minutes=minutes_offset)

            delivery_mode = random.choice(["self", "delivery"])
            status = random.choices(
                ["pending_pay", "paid", "picked", "done"],
                weights=[0.05, 0.35, 0.25, 0.35],
            )[0]
            paid_at = None
            finished_at = None
            if status in ["paid", "picked", "done"]:
                paid_at = created_at + datetime.timedelta(minutes=random.randint(1, 20))
            if status in ["picked", "done"]:
                ref = paid_at or created_at
                finished_at = ref + datetime.timedelta(minutes=random.randint(5, 25))

            order_no = "ORD{}T{:04d}".format(
                created_at.strftime("%Y%m%d%H%M"),
                random.randint(0, 9999),
            )
            while any(o[0] == order_no for o in order_rows):
                order_no = "ORD{}T{:04d}".format(
                    created_at.strftime("%Y%m%d%H%M"),
                    random.randint(0, 9999),
                )

            drinks = [p for p in products if p[3] not in ("小蛋糕", "甜甜圈")]
            desserts = [p for p in products if p[3] in ("小蛋糕", "甜甜圈")]
            num_items = random.choices([1, 2, 3, 4], weights=[0.15, 0.4, 0.3, 0.15])[0]
            want_dessert = random.random() < 0.6

            chosen = []
            if drinks:
                d_n = min(len(drinks), max(1, num_items - (1 if (want_dessert and desserts) else 0)))
                chosen.extend(random.sample(drinks, k=d_n))
            if want_dessert and desserts and len(chosen) < num_items:
                s_n = min(len(desserts), num_items - len(chosen))
                chosen.extend(random.sample(desserts, k=s_n))
            if len(chosen) < num_items:
                remaining = [p for p in products if p not in chosen]
                if remaining:
                    k = min(len(remaining), num_items - len(chosen))
                    chosen.extend(random.sample(remaining, k=k))

            total_amount = Decimal("0.00")
            tmp_item_rows = []
            for (prod_id, price, prod_name, _cat) in chosen:
                qty = random.randint(1, 3)
                line_total = Decimal(str(price)) * qty
                total_amount += line_total
                tmp_item_rows.append((prod_id, str(prod_name), price, qty, line_total))

            discount = Decimal("0.00")
            if total_amount >= 80:
                discount = Decimal("20.00")
            payable = max(total_amount - discount, Decimal("0.00"))
            paid_amount = payable if status in ["paid", "picked", "done"] else Decimal("0.00")
            payment_method = random.choice(["TNG", "OnlineBank"])

            order_rows.append(
                (
                    order_no,
                    user_id,
                    store_id,
                    delivery_mode,
                    status,
                    total_amount,
                    discount,
                    payable,
                    paid_amount,
                    payment_method,
                    created_at,
                    paid_at,
                    finished_at,
                )
            )
            if delivery_mode == "delivery":
                addr = random_malaysia_address()
                city = _parse_city_from_address(addr)
                lat, lng = _random_latlng_for_city(city)
                delivery_rows.append((order_no, addr, lat, lng))
            for (prod_id, prod_name, price, qty, line_total) in tmp_item_rows:
                item_rows.append((order_no, prod_id, prod_name, price, qty, line_total))

        if not order_rows:
            print("No orders to insert.")
            return

        sql_order = """
        INSERT INTO orders
        (order_no, user_id, store_id, delivery_mode, status,
         total_amount, discount_amount, payable_amount, paid_amount,
         payment_method, created_at, paid_at, finished_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        with conn.cursor() as cur:
            cur.executemany(sql_order, order_rows)
        conn.commit()

        placeholders = ",".join(["%s"] * len(order_rows))
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, order_no FROM orders WHERE order_no IN (" + placeholders + ")",
                [o[0] for o in order_rows],
            )
            mapping = {r["order_no"]: r["id"] for r in cur.fetchall()}

        sql_items = """
        INSERT INTO order_items
        (order_id, product_id, product_variant_id, product_name_snap, unit_price, qty, line_total)
        VALUES (%s,%s,NULL,%s,%s,%s,%s)
        """
        params_items = []
        for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
            oid = mapping.get(order_no)
            if oid:
                params_items.append((oid, prod_id, prod_name, price, qty, line_total))
        if params_items:
            with conn.cursor() as cur:
                cur.executemany(sql_items, params_items)
            conn.commit()

        if delivery_rows:
            sql_del = """
            INSERT INTO order_delivery_info
            (order_id, receiver_name, phone, full_address, postcode, lat, lng)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """
            params_del = []
            for order_no, addr, lat, lng in delivery_rows:
                oid = mapping.get(order_no)
                if not oid:
                    continue
                try:
                    postcode = str(addr).split()[-3]
                except Exception:
                    postcode = None
                params_del.append((oid, fake.name(), fake.phone_number(), addr, postcode, lat, lng))
            if params_del:
                with conn.cursor() as cur:
                    cur.executemany(sql_del, params_del)
                conn.commit()

        print("Generated %d orders for today (%s), 09:00–20:00." % (len(order_rows), today.isoformat()))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
