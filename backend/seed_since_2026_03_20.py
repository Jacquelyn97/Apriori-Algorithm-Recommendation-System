import datetime
import random
from decimal import Decimal

from db import get_conn
from seed_data import (
    random_malaysia_address,
    _parse_city_from_address,
    _random_latlng_for_city,
    fake,
)


START_DATE = datetime.date(2026, 3, 20)
OPEN_HOUR = 9
CLOSE_HOUR = 20  # exclusive upper bound (last minute 19:59)


def main():
    end_date = datetime.date.today()
    if end_date < START_DATE:
        print(f"Today ({end_date}) is earlier than {START_DATE}, nothing to generate.")
        return

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users")
            users = [r["id"] for r in (cur.fetchall() or [])]
            cur.execute("SELECT id, code FROM stores")
            stores = cur.fetchall() or []
            code_to_id = {r["code"]: r["id"] for r in stores}
            cur.execute(
                """
                SELECT p.id, p.base_price, p.name, c.name AS category_name
                FROM products p
                LEFT JOIN product_categories c ON c.id = p.category_id
                WHERE p.is_active = 1
                """
            )
            products = [
                (r["id"], r["base_price"], r["name"], r["category_name"])
                for r in (cur.fetchall() or [])
            ]

        if not users or not products:
            print("Skip: missing users or products.")
            return

        store_candidates = [x for x in [code_to_id.get("kuchai"), code_to_id.get("cheras"), code_to_id.get("sri_petal")] if x]
        if not store_candidates:
            print("Skip: no stores available.")
            return

        order_rows = []
        item_rows = []
        delivery_rows = []
        seq = random.randint(20000, 90000)

        total_days = (end_date - START_DATE).days + 1
        generated_days = 0
        for i in range(total_days):
            day = START_DATE + datetime.timedelta(days=i)
            # 周日休息（weekday=6）
            if day.weekday() == 6:
                continue
            generated_days += 1

            n = random.randint(24, 58)
            for _ in range(n):
                user_id = random.choice(users)
                store_id = random.choice(store_candidates)
                delivery_mode = random.choice(["self", "delivery"])
                status = random.choices(
                    ["pending_pay", "paid", "picked", "done"],
                    weights=[0.07, 0.35, 0.22, 0.36],
                )[0]

                minutes = random.randint(0, (CLOSE_HOUR - OPEN_HOUR) * 60 - 1)
                created_at = datetime.datetime.combine(day, datetime.time(OPEN_HOUR, 0, 0)) + datetime.timedelta(minutes=minutes)

                paid_at = None
                finished_at = None
                if status in ["paid", "picked", "done"]:
                    paid_at = created_at + datetime.timedelta(minutes=random.randint(1, 20))
                if status in ["picked", "done"]:
                    finished_at = (paid_at or created_at) + datetime.timedelta(minutes=random.randint(5, 25))

                order_no = "ORD{}N{:05d}".format(created_at.strftime("%Y%m%d%H%M"), seq)
                seq += 1

                drinks = [p for p in products if p[3] not in ("小蛋糕", "甜甜圈")]
                desserts = [p for p in products if p[3] in ("小蛋糕", "甜甜圈")]
                num_items = random.choices([1, 2, 3, 4], weights=[0.12, 0.42, 0.31, 0.15])[0]
                want_dessert = random.random() < 0.58

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
            print("No orders generated.")
            return

        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO orders
                (order_no, user_id, store_id, delivery_mode, status,
                 total_amount, discount_amount, payable_amount, paid_amount,
                 payment_method, created_at, paid_at, finished_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                order_rows,
            )
        conn.commit()

        order_nos = [o[0] for o in order_rows]
        placeholders = ",".join(["%s"] * len(order_nos))
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, order_no FROM orders WHERE order_no IN ({placeholders})",
                order_nos,
            )
            mapping = {r["order_no"]: r["id"] for r in (cur.fetchall() or [])}

        params_items = []
        for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
            oid = mapping.get(order_no)
            if oid:
                params_items.append((oid, prod_id, prod_name, price, qty, line_total))

        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO order_items
                (order_id, product_id, product_variant_id, product_name_snap, unit_price, qty, line_total)
                VALUES (%s,%s,NULL,%s,%s,%s,%s)
                """,
                params_items,
            )
        conn.commit()

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
                cur.executemany(
                    """
                    INSERT INTO order_delivery_info
                    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                    """,
                    params_del,
                )
            conn.commit()

        print(
            f"Generated {len(order_rows)} orders from {START_DATE} to {end_date}. "
            f"Workdays generated: {generated_days}, Sundays skipped."
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()

