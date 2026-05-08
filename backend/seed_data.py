import random
import datetime
from decimal import Decimal
from faker import Faker
import pymysql

# ========== 配置部分 / Configuration ==========
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3307,
    "user": "root",
    "password": "123456",
    "database": "tea_shop",
    "charset": "utf8mb4",
}

# 控制生成规模 / Generation scale
NUM_USERS_MIN = 70
NUM_USERS_MAX = 100
MAX_ORDERS_PER_USER = 20

fake = Faker("zh_CN")


# ========== 简单 DB 帮助 / DB helpers ==========

def get_conn():
    return pymysql.connect(**DB_CONFIG)


def exec_many(conn, sql, params_list):
    if not params_list:
        return
    with conn.cursor() as cur:
        cur.executemany(sql, params_list)
    conn.commit()


# ========== 1. 门店 / Stores ==========

def seed_stores(conn):
    stores = [
        ("kuchai", "Tea Stories (Kuchai)",
         "Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park", "Kuala Lumpur", 3.088849, 101.686589),
        ("sri_petal", "Tea Stories (Sri Petaling)",
         "Jalan Radin Bagus, Bandar Baru Sri Petaling", "Kuala Lumpur", 3.201633, 101.624323),
        ("cheras", "Tea Stories (Cheras)",
         "Jalan Dataran Cheras 3, Dataran Perniagaan Cheras", "Kuala Lumpur", 3.035920, 101.765402),
    ]
    sql = """
    INSERT INTO stores (code, name, address, city, lat, lng, open_hours)
    VALUES (%s,%s,%s,%s,%s,%s,'Mon-Sun 09:00-22:00')
    """
    exec_many(conn, sql, stores)


# ========== 2. 商品与类目 / Products and categories ==========
def seed_categories_products(conn):
    # 类目：完全按照 weapp/utils/menuData.js 的 categories 来 / Categories follow weapp/utils/menuData.js exactly
    categories = [
        ("热销",       None, 1),   # id: hot
        ("招牌人气",   None, 2),   # id: signature
        ("水果茶",     None, 3),   # id: fruit
        ("创新",       None, 4),   # id: creative
        ("少女系",     None, 5),   # id: girl
        ("夏日",       None, 6),   # id: summer
        ("健康轻饮",   None, 7),   # id: healthy
        ("小吃及甜品", None, 8),   # id: snack
    ]
    sql_cat = """
    INSERT INTO product_categories (name, parent_id, display_order)
    VALUES (%s,%s,%s)
    """
    exec_many(conn, sql_cat, categories)

    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM product_categories")
        cat_rows = cur.fetchall()
    cat_map = {row["name"]: row["id"] for row in cat_rows}



    # 商品池：多品类，避免订单只刷同一商品 / Multi-category product pool to avoid single-item dominance
        # 商品：完全按 menuData.js，同步前端所有饮品/小吃 / Products mirror menuData.js for frontend alignment
    # cat_map 映射：hot→热销、signature→招牌人气、fruit→水果茶、 / cat_map mapping for category ids
    #               creative→创新、girl→少女系、summer→夏日、 / continued mapping
    #               healthy→健康轻饮、snack→小吃及甜品 / continued mapping
    products = [
        # 热销 hot / Hot sales
        (cat_map["热销"], "黑糖珍珠奶茶",    Decimal("10.00"), "/assets/rm01.jpg"),
        (cat_map["热销"], "芝士奶盖抹茶",    Decimal("14.00"), "/assets/rm02.jpg"),
        (cat_map["热销"], "焦糖布丁奶茶",    Decimal("13.00"), "/assets/rm03.jpg"),

        # 招牌人气 signature / Signature picks
        (cat_map["招牌人气"], "金凤乌龙奶茶",  Decimal("12.00"), "/assets/zp01.jpg"),
        (cat_map["招牌人气"], "多多绿茶奶茶",  Decimal("12.00"), "/assets/zp02.jpg"),
        (cat_map["招牌人气"], "奥利奥脆脆奶茶",Decimal("14.00"), "/assets/zp03.jpg"),

        # 水果茶 fruit / Fruit tea
        (cat_map["水果茶"], "杨枝甘露奶茶",    Decimal("16.00"), "/assets/sg01.jpg"),
        (cat_map["水果茶"], "草莓芝士奶盖",    Decimal("14.00"), "/assets/sg02.jpg"),
        (cat_map["水果茶"], "百香果绿茶",      Decimal("11.00"), "/assets/sg03.jpg"),
        (cat_map["水果茶"], "芒果爆柠奶茶",    Decimal("14.00"), "/assets/sg04.jpg"),
        (cat_map["水果茶"], "奇异果百香奶茶",  Decimal("12.00"), "/assets/sg05.jpg"),
        (cat_map["水果茶"], "橙香茉莉奶茶",    Decimal("11.00"), "/assets/sg06.jpg"),
        (cat_map["水果茶"], "火龙果椰香奶茶",  Decimal("14.00"), "/assets/sg07.jpg"),
        (cat_map["水果茶"], "柚子蜂蜜奶茶",    Decimal("14.00"), "/assets/sg08.jpg"),

        # 创新 creative / Creative series
        (cat_map["创新"], "燕麦奶茶",          Decimal("9.00"),  "/assets/cx01.jpg"),
        (cat_map["创新"], "椰椰生椰拿铁",      Decimal("11.00"), "/assets/cx02.jpg"),
        (cat_map["创新"], "紫薯珍珠奶茶",      Decimal("12.00"), "/assets/cx03.jpg"),

        # 少女系 girl / Girly series
        (cat_map["少女系"], "玫瑰荔枝奶茶",      Decimal("16.00"), "/assets/sn01.jpg"),
        (cat_map["少女系"], "樱花草莓奶茶",      Decimal("18.00"), "/assets/sn02.jpg"),
        (cat_map["少女系"], "蓝莓优格奶茶",      Decimal("13.00"), "/assets/sn03.jpg"),
        (cat_map["少女系"], "双拼渐变奶茶",      Decimal("18.00"), "/assets/sn04.jpg"),
        (cat_map["少女系"], "樱花芝士奶盖茶",    Decimal("21.00"), "/assets/sn05.jpg"),
        (cat_map["少女系"], "梦幻彩虹奶茶",      Decimal("25.00"), "/assets/sn06.jpg"),
        (cat_map["少女系"], "薰衣草奶茶",        Decimal("16.00"), "/assets/sn07.jpg"),
        (cat_map["少女系"], "红丝绒可可奶茶",    Decimal("18.00"), "/assets/sn08.jpg"),

        # 夏日 summer / Summer series
        (cat_map["夏日"], "椰果青柠奶茶",      Decimal("15.00"), "/assets/xr01.jpg"),
        (cat_map["夏日"], "西瓜冰奶茶",        Decimal("14.00"), "/assets/xr02.jpg"),
        (cat_map["夏日"], "蜂蜜柠檬奶茶",      Decimal("12.00"), "/assets/xr03.jpg"),
        (cat_map["夏日"], "冰镇哈密瓜奶茶",    Decimal("14.00"), "/assets/xr04.jpg"),
        (cat_map["夏日"], "薄荷青柠奶茶",      Decimal("12.00"), "/assets/xr05.jpg"),
        (cat_map["夏日"], "蓝柑冰奶茶",        Decimal("16.00"), "/assets/xr06.jpg"),
        (cat_map["夏日"], "冰冻葡萄奶茶",      Decimal("12.00"), "/assets/xr07.jpg"),
        (cat_map["夏日"], "菠萝椰香奶茶",      Decimal("14.00"), "/assets/xr08.jpg"),

        # 健康轻饮 healthy / Healthy drinks
        (cat_map["健康轻饮"], "豆乳黑芝麻奶茶",  Decimal("10.00"), "/assets/jk01.jpg"),
        (cat_map["健康轻饮"], "低脂抹茶拿铁",    Decimal("12.00"), "/assets/jk02.jpg"),
        (cat_map["健康轻饮"], "燕麦红枣奶茶",    Decimal("8.00"),  "/assets/jk03.jpg"),
        (cat_map["健康轻饮"], "豆乳燕麦奶茶",    Decimal("6.00"),  "/assets/jk04.jpg"),
        (cat_map["健康轻饮"], "黑豆芝麻豆浆奶茶",Decimal("12.00"), "/assets/jk05.jpg"),
        (cat_map["健康轻饮"], "蜂蜜柠檬普洱奶茶",Decimal("9.00"),  "/assets/jk06.jpg"),
        (cat_map["健康轻饮"], "无糖生椰抹茶",    Decimal("14.00"), "/assets/jk07.jpg"),

        # 小吃及甜品 snack —— 普通小吃 / Snacks & desserts - regular snacks
        (cat_map["小吃及甜品"], "炸鸡块",        Decimal("13.00"), "/assets/xc01.jpg"),
        (cat_map["小吃及甜品"], "鸡米花",        Decimal("6.00"),  "/assets/xc02.jpg"),
        (cat_map["小吃及甜品"], "薯条",          Decimal("5.00"),  "/assets/xc03.jpg"),
        (cat_map["小吃及甜品"], "曲奇",          Decimal("8.00"),  "/assets/xc09.jpg"),
        (cat_map["小吃及甜品"], "芝士蛋糕",      Decimal("13.00"), "/assets/xc10.jpg"),
        (cat_map["小吃及甜品"], "麻薯球",        Decimal("8.00"),  "/assets/xc11.jpg"),

        # 小吃及甜品 snack —— 小蛋糕各口味（variants 展开成独立商品） / Snacks & desserts - cupcake variants as standalone products
        (cat_map["小吃及甜品"], "小蛋糕（樱花龙眼）",   Decimal("14.00"), "/assets/xc04.jpg"),
        (cat_map["小吃及甜品"], "小蛋糕（抹茶红豆）",   Decimal("14.00"), "/assets/xc05.jpg"),
        (cat_map["小吃及甜品"], "小蛋糕（蓝莓酸奶）",   Decimal("14.00"), "/assets/xc06.jpg"),
        (cat_map["小吃及甜品"], "小蛋糕（芒果百香果）", Decimal("14.00"), "/assets/xc07.jpg"),
        (cat_map["小吃及甜品"], "小蛋糕（草莓巧克力）", Decimal("14.00"), "/assets/xc08.jpg"),

        # 小吃及甜品 snack —— 甜甜圈各口味（variants 展开成独立商品） / Snacks & desserts - donut variants as standalone products
        (cat_map["小吃及甜品"], "甜甜圈（椰子椰奶）",   Decimal("9.00"), "/assets/xc12.jpg"),
        (cat_map["小吃及甜品"], "甜甜圈（草莓巧克力）", Decimal("9.00"), "/assets/xc13.jpg"),
        (cat_map["小吃及甜品"], "甜甜圈（草莓樱花）",   Decimal("9.00"), "/assets/xc14.jpg"),
        (cat_map["小吃及甜品"], "甜甜圈（草莓椰奶）",   Decimal("9.00"), "/assets/xc15.jpg"),
        (cat_map["小吃及甜品"], "甜甜圈（巧克力果仁）", Decimal("9.00"), "/assets/xc16.jpg"),
        (cat_map["小吃及甜品"], "甜甜圈（草莓椰子）",   Decimal("9.00"), "/assets/xc17.jpg"),
    ]
    sql_prod = """
    INSERT INTO products (category_id, name, base_price, image_url, is_active)
    VALUES (%s,%s,%s,%s,1)
    """
    exec_many(conn, sql_prod, products)


# ========== 3. 用户及画像 / Users and profiles ==========

def random_income():
    return random.choice(["低", "中", "高"])


def seed_users(conn):
    num_users = random.randint(NUM_USERS_MIN, NUM_USERS_MAX)
    user_rows = []
    profile_rows = []

    for _ in range(num_users):
        openid = fake.uuid4()
        nickname = fake.first_name()
        avatar = f"https://example.com/avatar/{fake.random_int(1, 1000)}.png"
        created_at = fake.date_time_between(start_date="-180d", end_date="now")
        user_rows.append((openid, nickname, avatar, "miniapp", created_at))

    sql_user = """
    INSERT INTO users (openid, nickname, avatar_url, channel, created_at)
    VALUES (%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_user, user_rows)

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users")
        user_ids = [r["id"] for r in cur.fetchall()]

    for uid in user_ids:
        gender = random.choice(["M", "F", "U"])
        age = random.randint(18, 45)
        occupation = random.choice(["学生", "上班族", "自由职业", "店员", "教师", "程序员"])
        city = random.choice(["Kuala Lumpur", "Petaling Jaya", "Seri Kembangan", "Cheras"])
        province = "Selangor"
        income = random_income()
        marital = random.choice(["未婚", "已婚", "未知"])

        profile_rows.append(
            (uid, gender, age, occupation, city, province, income, marital)
        )

    sql_prof = """
    INSERT INTO user_profile
    (user_id, gender, age, occupation, city, province, income_level, marital_status)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_prof, profile_rows)


# ========== 4. 地址生成（马来西亚英文格式） / Address generation (Malaysia format) ==========

def random_malaysia_address():
    """
    普通住宅: [house_no] [street] [neighbourhood] [postcode] [city] [state]
    Landed house format: [house_no] [street] [neighbourhood] [postcode] [city] [state]
    公寓:     [floor]-[unit] [street] [neighbourhood] [postcode] [city] [state]
    Apartment format: [floor]-[unit] [street] [neighbourhood] [postcode] [city] [state]
    """
    city = random.choice(["Kuala Lumpur", "Petaling Jaya", "Seri Kembangan", "Cheras"])
    state = "Selangor"

    street_names = [
        "Jalan Kuchai Maju",
        "Jalan Radin Bagus",
        "Jalan Dataran Cheras",
        "Jalan SS 2/72",
        "Jalan PJU 8/1",
    ]
    neighbourhoods = [
        "Taman Kuchai",
        "Bandar Baru Sri Petaling",
        "Dataran Perniagaan Cheras",
        "Taman Indah",
        "Taman Seri Kembangan",
        "Ampang",
        "Kepong",
        "Serdang",
        "Sri Serdang",
        "Kampung Baru",
        "Chan Sow Lin",
        "Setapak",
        "Bangsar",
        "Bukit Jalil",
        "Puchong",
        "Wangsa Maju",
    ]

    street = random.choice(street_names)
    neighbourhood = random.choice(neighbourhoods)

    # Postcode rules (demo data, aligned with dashboard/customer profile rules)
    if "Chan Sow Lin" in neighbourhood:
        postcode = "55200"
    elif "Wangsa Maju" in neighbourhood:
        postcode = "53300"
    elif "Setapak" in neighbourhood:
        postcode = "53000"
    elif "Bangsar" in neighbourhood:
        postcode = "59100"
    elif "Bukit Jalil" in neighbourhood:
        postcode = "57000"
    elif "Puchong" in neighbourhood:
        postcode = "47100"
    elif "Ampang" in neighbourhood:
        postcode = "55000"
    elif "Kepong" in neighbourhood:
        postcode = "43700"
    elif "Sri Serdang" in neighbourhood:
        postcode = "43300"
    elif "Kampung Baru" in neighbourhood:
        postcode = "43300"
    elif neighbourhood == "Serdang":
        postcode = "43400"
    elif city == "Kuala Lumpur":
        postcode = random.choice(["55700", "55710", "55100", "53990", "57000", "59100", "53000", "53300", "55200", "55000"])
    elif city == "Cheras":
        # Keep 56100 as Top1, 43300 as Top2
        postcode = random.choice(["56100", "56100", "56100", "43300", "43300", "56000"])
    else:
        # fallback for other cities
        postcode = random.choice(["43000", "57000", "58000"])

    if random.random() < 0.4:  # 公寓 / Apartment
        floor = random.randint(3, 25)
        unit = random.randint(1, 20)
        return f"{floor}-{unit} {street} {neighbourhood} {postcode} {city} {state}"
    else:                       # 普通住宅 / Landed house
        house_no = random.randint(1, 50)
        return f"{house_no} {street} {neighbourhood} {postcode} {city} {state}"


def _parse_city_from_address(addr: str):
    if not addr:
        return None
    for c in ("Kuala Lumpur", "Petaling Jaya", "Seri Kembangan", "Cheras"):
        if c in addr:
            return c
    return None


def _random_latlng_for_city(city: str):
    """
    Generate a plausible lat/lng point within the city area.
    These are loose bounding boxes intended for demo heatmaps.
    """
    bboxes = {
        # (lat_min, lat_max, lng_min, lng_max)
        "Kuala Lumpur": (3.05, 3.25, 101.60, 101.78),
        "Petaling Jaya": (3.06, 3.18, 101.58, 101.67),
        "Seri Kembangan": (3.00, 3.08, 101.68, 101.74),
        "Cheras": (3.03, 3.12, 101.72, 101.80),
    }
    lat_min, lat_max, lng_min, lng_max = bboxes.get(city or "", bboxes["Kuala Lumpur"])
    lat = random.uniform(lat_min, lat_max)
    lng = random.uniform(lng_min, lng_max)
    return lat, lng


# ========== 5. 订单 & 明细 & 配送信息 / Orders, items, and delivery ==========

def seed_orders(conn):
    # 准备维度数据 / Prepare dimension data
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users")
        users = [r["id"] for r in cur.fetchall()]
        # 用 code 映射门店，方便按开店日期控制 / Map store codes for opening-date-based selection
        cur.execute("SELECT id, code FROM stores")
        store_rows = cur.fetchall()
        code_to_id = {row["code"]: row["id"] for row in store_rows}
        # 直接使用 products（带类目），不区分中杯/大杯 / Use products with categories, without cup-size variants
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

    order_rows = []
    item_rows = []
    delivery_rows = []

    next_order_num = 1

    for user_id in users:
        num_orders = random.randint(1, MAX_ORDERS_PER_USER)
        for _ in range(num_orders):
            # 根据开店时间选择可用门店 / Select stores based on opening dates
            kuchai_id = code_to_id.get("kuchai")
            cheras_id = code_to_id.get("cheras")
            sri_id = code_to_id.get("sri_petal")
            delivery_mode = random.choice(["self", "delivery"])
            status = random.choices(
                ["pending_pay", "paid", "picked", "done"],
                weights=[0.1, 0.3, 0.2, 0.4],
            )[0]

            created_at = fake.date_time_between(
                start_date=datetime.datetime(1999, 3, 24), end_date="now"
            )
            order_date = created_at.date()
            open_cheras = datetime.date(2011, 5, 15)
            open_sri = datetime.date(2015, 8, 12)
            if order_date < open_cheras:
                candidates = [kuchai_id]
            elif order_date < open_sri:
                candidates = [kuchai_id, cheras_id]
            else:
                candidates = [kuchai_id, cheras_id, sri_id]
            candidates = [cid for cid in candidates if cid]
            store_id = random.choice(candidates)
            paid_at = None
            finished_at = None
            if status in ["paid", "picked", "done"]:
                paid_at = created_at + datetime.timedelta(minutes=random.randint(1, 30))
            if status in ["picked", "done"]:
                finished_at = (paid_at or created_at) + datetime.timedelta(minutes=random.randint(5, 30))

            order_no = "ORD{}E{:03d}".format(
                created_at.strftime("%Y%m%d%H%M"), next_order_num
            )
            next_order_num += 1

            # 构造明细：尽量饮料 + 甜品的组合 / Build line items with drink+dessert combinations
            drinks = [p for p in products if (p[3] not in ("小蛋糕", "甜甜圈"))]
            desserts = [p for p in products if (p[3] in ("小蛋糕", "甜甜圈"))]

            num_items = random.choices([1, 2, 3, 4, 5], weights=[0.12, 0.34, 0.28, 0.18, 0.08])[0]
            want_dessert = random.random() < 0.55

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

            chosen_products = chosen
            total_amount = Decimal("0.00")

            tmp_item_rows = []
            for (prod_id, price, prod_name, _cat_name) in chosen_products:
                qty = random.randint(1, 3)
                line_total = Decimal(str(price)) * qty
                total_amount += line_total
                tmp_item_rows.append((prod_id, str(prod_name), price, qty, line_total))

            discount = Decimal("0.00")
            if total_amount >= 99:
                discount = Decimal("25.00")
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
                address_text = random_malaysia_address()
                city = _parse_city_from_address(address_text)
                lat, lng = _random_latlng_for_city(city)
                delivery_rows.append((order_no, address_text, lat, lng))

            for (prod_id, prod_name, price, qty, line_total) in tmp_item_rows:
                item_rows.append((order_no, prod_id, prod_name, price, qty, line_total))

    # 插入 orders / Insert into orders
    sql_order = """
    INSERT INTO orders
    (order_no, user_id, store_id, delivery_mode, status,
     total_amount, discount_amount, payable_amount, paid_amount,
     payment_method, created_at, paid_at, finished_at)
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_order, order_rows)

    # 查询 order_id 映射 / Query order_id mapping
    with conn.cursor() as cur:
        cur.execute("SELECT id, order_no FROM orders")
        mapping = {r["order_no"]: r["id"] for r in cur.fetchall()}

    # 插入 order_items（不区分规格，product_variant_id 为 NULL） / Insert order_items without size variants
    sql_items = """
    INSERT INTO order_items
    (order_id, product_id, product_variant_id, product_name_snap,
     unit_price, qty, line_total)
    VALUES (%s,%s,NULL,%s,%s,%s,%s)
    """
    params_items = []
    for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
        order_id = mapping[order_no]
        params_items.append(
            (order_id, prod_id, prod_name, price, qty, line_total)
        )
    exec_many(conn, sql_items, params_items)

    # 插入配送信息 / Insert delivery details
    sql_del = """
    INSERT INTO order_delivery_info
    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """
    params_del = []
    for order_no, addr, lat, lng in delivery_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        # full_address format: "... [postcode] [city] [state]"
        try:
            postcode = str(addr).split()[-3]
        except Exception:
            postcode = None
        params_del.append(
            (order_id, fake.name(), fake.phone_number(), addr, postcode, lat, lng)
        )
    exec_many(conn, sql_del, params_del)


# ========== 6. 额外「近期订单」增强（让最近 7~30 天更有数据） / Recent-order boost ==========

def seed_recent_boost(conn, days=7, min_orders_per_day=20, max_orders_per_day=40):
    """
    追加一批最近 days 天内的订单，专门用来让 Dashboard / Real-time Sales 的
    7 天和 30 天图看起来更「有生意」一点，不会全部接近 0。
    Add extra recent orders so 7-day and 30-day charts look realistic and non-zero.

    可以多次调用，每次都会再插入一批新订单。
    This function is repeatable and adds a new batch each call.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users")
        users = [r["id"] for r in cur.fetchall()]
        cur.execute("SELECT id, code FROM stores")
        store_rows = cur.fetchall()
        code_to_id = {row["code"]: row["id"] for row in store_rows}
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
            for r in cur.fetchall()
        ]

    if not users or not products or not code_to_id:
        print("No users / stores / products, skip seed_recent_boost.")
        return

    order_rows = []
    item_rows = []
    delivery_rows = []

    today = datetime.date.today()
    seq = 100000  # 序号前移，避免和历史生成的序号冲突 / Offset sequence to reduce collision risk

    for i in range(days):
        day = today - datetime.timedelta(days=i)
        num_orders = random.randint(min_orders_per_day, max_orders_per_day)
        for _ in range(num_orders):
            user_id = random.choice(users)
            delivery_mode = random.choice(["self", "delivery"])
            status = random.choices(
                ["pending_pay", "paid", "picked", "done"],
                weights=[0.05, 0.35, 0.25, 0.35],
            )[0]

            # 当天任意时间 / Random time within the day
            minutes = random.randint(0, 23 * 60 + 59)
            created_at = datetime.datetime.combine(day, datetime.time.min) + datetime.timedelta(minutes=minutes)
            order_date = created_at.date()
            kuchai_id = code_to_id.get("kuchai")
            cheras_id = code_to_id.get("cheras")
            sri_id = code_to_id.get("sri_petal")
            open_cheras = datetime.date(2011, 5, 15)
            open_sri = datetime.date(2015, 8, 12)
            if order_date < open_cheras:
                candidates = [kuchai_id]
            elif order_date < open_sri:
                candidates = [kuchai_id, cheras_id]
            else:
                candidates = [kuchai_id, cheras_id, sri_id]
            candidates = [cid for cid in candidates if cid]
            store_id = random.choice(candidates)
            paid_at = None
            finished_at = None
            if status in ["paid", "picked", "done"]:
                paid_at = created_at + datetime.timedelta(minutes=random.randint(1, 20))
            if status in ["picked", "done"]:
                finished_at = (paid_at or created_at) + datetime.timedelta(minutes=random.randint(5, 25))

            order_no = "ORD{}B{:03d}".format(created_at.strftime("%Y%m%d%H%M"), seq)
            seq += 1

            drinks = [p for p in products if (p[3] not in ("小蛋糕", "甜甜圈"))]
            desserts = [p for p in products if (p[3] in ("小蛋糕", "甜甜圈"))]

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
            for (prod_id, price, prod_name, _cat_name) in chosen:
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
                address_text = random_malaysia_address()
                city = _parse_city_from_address(address_text)
                lat, lng = _random_latlng_for_city(city)
                delivery_rows.append((order_no, address_text, lat, lng))

            for (prod_id, prod_name, price, qty, line_total) in tmp_item_rows:
                item_rows.append((order_no, prod_id, prod_name, price, qty, line_total))

    sql_order = """
    INSERT INTO orders
    (order_no, user_id, store_id, delivery_mode, status,
     total_amount, discount_amount, payable_amount, paid_amount,
     payment_method, created_at, paid_at, finished_at)
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_order, order_rows)

    with conn.cursor() as cur:
        cur.execute("SELECT id, order_no FROM orders")
        mapping = {r["order_no"]: r["id"] for r in cur.fetchall()}

    sql_items = """
    INSERT INTO order_items
    (order_id, product_id, product_variant_id, product_name_snap,
     unit_price, qty, line_total)
    VALUES (%s,%s,NULL,%s,%s,%s,%s)
    """
    params_items = []
    for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        params_items.append((order_id, prod_id, prod_name, price, qty, line_total))
    exec_many(conn, sql_items, params_items)

    sql_del = """
    INSERT INTO order_delivery_info
    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """
    params_del = []
    for order_no, addr, lat, lng in delivery_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        try:
            postcode = str(addr).split()[-3]
        except Exception:
            postcode = None
        params_del.append((order_id, fake.name(), fake.phone_number(), addr, postcode, lat, lng))
    exec_many(conn, sql_del, params_del)


# ========== 7. 长期历史增强（从 1999-03-24 开始，按开店时间分配门店） / Long history boost ==========

def seed_long_history(conn, start_date=None, end_date=None,
                      min_orders_per_day=5, max_orders_per_day=20):
    """
    从 start_date 到 end_date（含）为每一天追加一些订单，遵守门店开店时间。
    Add orders day-by-day from start_date to end_date while respecting opening dates.
    - 1999-03-24 ~ 2011-05-14: 仅 Kuchai / Kuchai only
    - 2011-05-15 ~ 2015-08-11: Kuchai + Cheras
    - 2015-08-12 以后: 三家店都有 / All three stores available
    """
    if start_date is None:
        start_date = datetime.date(1999, 3, 24)
    if end_date is None:
        end_date = datetime.date.today()

    if end_date < start_date:
        return

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users")
        users = [r["id"] for r in cur.fetchall()]
        cur.execute("SELECT id, code FROM stores")
        store_rows = cur.fetchall()
        code_to_id = {row["code"]: row["id"] for row in store_rows}
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
            for r in cur.fetchall()
        ]

    if not users or not products or not code_to_id:
        print("No users / stores / products, skip seed_long_history.")
        return

    order_rows = []
    item_rows = []
    delivery_rows = []

    kuchai_id = code_to_id.get("kuchai")
    cheras_id = code_to_id.get("cheras")
    sri_id = code_to_id.get("sri_petal")
    open_cheras = datetime.date(2011, 5, 15)
    open_sri = datetime.date(2015, 8, 12)

    total_days = (end_date - start_date).days + 1
    seq = 200000

    for offset in range(total_days):
        day = start_date + datetime.timedelta(days=offset)
        n = random.randint(min_orders_per_day, max_orders_per_day)
        for _ in range(n):
            user_id = random.choice(users)
            # 一天中的随机时间 / Random time within the day
            minutes = random.randint(0, 23 * 60 + 59)
            created_at = datetime.datetime.combine(day, datetime.time.min) + datetime.timedelta(minutes=minutes)

            if day < open_cheras:
                candidates = [kuchai_id]
            elif day < open_sri:
                candidates = [kuchai_id, cheras_id]
            else:
                candidates = [kuchai_id, cheras_id, sri_id]
            candidates = [cid for cid in candidates if cid]
            if not candidates:
                continue
            store_id = random.choice(candidates)

            delivery_mode = random.choice(["self", "delivery"])
            status = random.choices(
                ["pending_pay", "paid", "picked", "done"],
                weights=[0.05, 0.35, 0.25, 0.35],
            )[0]
            paid_at = None
            finished_at = None
            if status in ["paid", "picked", "done"]:
                paid_at = created_at + datetime.timedelta(minutes=random.randint(1, 25))
            if status in ["picked", "done"]:
                finished_at = (paid_at or created_at) + datetime.timedelta(minutes=random.randint(5, 25))

            order_no = "ORD{}H{:04d}".format(created_at.strftime("%Y%m%d%H%M"), seq)
            seq += 1

            drinks = [p for p in products if (p[3] not in ("小蛋糕", "甜甜圈"))]
            desserts = [p for p in products if (p[3] in ("小蛋糕", "甜甜圈"))]
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
            for (prod_id, price, prod_name, _cat_name) in chosen:
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
                address_text = random_malaysia_address()
                city = _parse_city_from_address(address_text)
                lat, lng = _random_latlng_for_city(city)
                delivery_rows.append((order_no, address_text, lat, lng))

            for (prod_id, prod_name, price, qty, line_total) in tmp_item_rows:
                item_rows.append((order_no, prod_id, prod_name, price, qty, line_total))

    if not order_rows:
        return

    sql_order = """
    INSERT INTO orders
    (order_no, user_id, store_id, delivery_mode, status,
     total_amount, discount_amount, payable_amount, paid_amount,
     payment_method, created_at, paid_at, finished_at)
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_order, order_rows)

    with conn.cursor() as cur:
        cur.execute("SELECT id, order_no FROM orders")
        mapping = {r["order_no"]: r["id"] for r in cur.fetchall()}

    sql_items = """
    INSERT INTO order_items
    (order_id, product_id, product_variant_id, product_name_snap,
     unit_price, qty, line_total)
    VALUES (%s,%s,NULL,%s,%s,%s,%s)
    """
    params_items = []
    for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        params_items.append((order_id, prod_id, prod_name, price, qty, line_total))
    exec_many(conn, sql_items, params_items)

    sql_del = """
    INSERT INTO order_delivery_info
    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """
    params_del = []
    for order_no, addr, lat, lng in delivery_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        try:
            postcode = str(addr).split()[-3]
        except Exception:
            postcode = None
        params_del.append((order_id, fake.name(), fake.phone_number(), addr, postcode, lat, lng))
    exec_many(conn, sql_del, params_del)


# ========== 8. 指定门店增强（让某些分店的生意更好） / Branch-specific boost ==========

def seed_branch_boost(
    conn,
    store_code,
    start_date,
    end_date,
    min_orders_per_day=10,
    max_orders_per_day=25,
):
    """
    为指定门店在一段时间内追加订单，用于让某个分店的销量 / 客户数更高。
    Add extra orders for a specific branch in a date range to increase branch-level volume.
    只影响 orders / order_items / order_delivery_info，不动 users 表结构。
    Only touches orders/order_items/order_delivery_info; users table remains unchanged.
    """
    if end_date < start_date:
        return

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users")
        users = [r["id"] for r in cur.fetchall()]
        cur.execute("SELECT id, code FROM stores")
        store_rows = cur.fetchall()
        code_to_id = {row["code"]: row["id"] for row in store_rows}
        store_id = code_to_id.get(store_code)
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
            for r in cur.fetchall()
        ]

    if not users or not products or not store_id:
        print(f"Skip seed_branch_boost for {store_code}: missing users/products/store.")
        return

    order_rows = []
    item_rows = []
    delivery_rows = []

    total_days = (end_date - start_date).days + 1
    seq = 300000

    for offset in range(total_days):
        day = start_date + datetime.timedelta(days=offset)
        n = random.randint(min_orders_per_day, max_orders_per_day)
        for _ in range(n):
            user_id = random.choice(users)
            minutes = random.randint(0, 23 * 60 + 59)
            created_at = datetime.datetime.combine(day, datetime.time.min) + datetime.timedelta(minutes=minutes)

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
                finished_at = (paid_at or created_at) + datetime.timedelta(minutes=random.randint(5, 25))

            order_no = "ORD{}B{:04d}".format(created_at.strftime("%Y%m%d%H%M"), seq)
            seq += 1

            drinks = [p for p in products if (p[3] not in ("小蛋糕", "甜甜圈"))]
            desserts = [p for p in products if (p[3] in ("小蛋糕", "甜甜圈"))]
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
            for (prod_id, price, prod_name, _cat_name) in chosen:
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
                address_text = random_malaysia_address()
                city = _parse_city_from_address(address_text)
                lat, lng = _random_latlng_for_city(city)
                delivery_rows.append((order_no, address_text, lat, lng))

            for (prod_id, prod_name, price, qty, line_total) in tmp_item_rows:
                item_rows.append((order_no, prod_id, prod_name, price, qty, line_total))

    if not order_rows:
        return

    sql_order = """
    INSERT INTO orders
    (order_no, user_id, store_id, delivery_mode, status,
     total_amount, discount_amount, payable_amount, paid_amount,
     payment_method, created_at, paid_at, finished_at)
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    exec_many(conn, sql_order, order_rows)

    with conn.cursor() as cur:
        cur.execute("SELECT id, order_no FROM orders")
        mapping = {r["order_no"]: r["id"] for r in cur.fetchall()}

    sql_items = """
    INSERT INTO order_items
    (order_id, product_id, product_variant_id, product_name_snap,
     unit_price, qty, line_total)
    VALUES (%s,%s,NULL,%s,%s,%s,%s)
    """
    params_items = []
    for order_no, prod_id, prod_name, price, qty, line_total in item_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        params_items.append((order_id, prod_id, prod_name, price, qty, line_total))
    exec_many(conn, sql_items, params_items)

    sql_del = """
    INSERT INTO order_delivery_info
    (order_id, receiver_name, phone, full_address, postcode, lat, lng)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    """
    params_del = []
    for order_no, addr, lat, lng in delivery_rows:
        order_id = mapping.get(order_no)
        if not order_id:
            continue
        try:
            postcode = str(addr).split()[-3]
        except Exception:
            postcode = None
        params_del.append((order_id, fake.name(), fake.phone_number(), addr, postcode, lat, lng))
    exec_many(conn, sql_del, params_del)


# ========== main ==========

def main():
    conn = get_conn()
    try:
        print("Seeding stores...")
        seed_stores(conn)
        print("Seeding categories & products...")
        seed_categories_products(conn)
        print("Seeding users & profiles...")
        seed_users(conn)
        print("Seeding orders...")
        seed_orders(conn)
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()