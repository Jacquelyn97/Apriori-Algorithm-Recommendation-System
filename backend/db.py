import os
import sqlite3
from datetime import date, datetime
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  lat REAL,
  lng REAL,
  open_hours TEXT
);

CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  base_price REAL NOT NULL DEFAULT 0.0,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  channel TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  gender TEXT,
  age INTEGER,
  occupation TEXT,
  city TEXT,
  province TEXT,
  income_level TEXT,
  marital_status TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  delivery_mode TEXT NOT NULL DEFAULT 'self',
  status TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0.0,
  discount_amount REAL NOT NULL DEFAULT 0.0,
  payable_amount REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT,
  created_at TEXT,
  paid_at TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_variant_id INTEGER,
  product_name_snap TEXT,
  unit_price REAL NOT NULL DEFAULT 0.0,
  qty INTEGER NOT NULL DEFAULT 1,
  line_total REAL NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS order_delivery_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  receiver_name TEXT,
  phone TEXT,
  full_address TEXT,
  postcode TEXT,
  lat REAL,
  lng REAL
);
"""


def _parse_dt(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v
    s = str(v).strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def _register_functions(conn):
    conn.create_function("CURDATE", 0, lambda: date.today().isoformat())
    conn.create_function("NOW", 0, lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def year_(v):
        d = _parse_dt(v)
        return d.year if d else None

    def month_(v):
        d = _parse_dt(v)
        return d.month if d else None

    def hour_(v):
        d = _parse_dt(v)
        return d.hour if d else None

    def datediff_(a, b):
        da = _parse_dt(a)
        db = _parse_dt(b)
        if not da or not db:
            return None
        return (da.date() - db.date()).days

    def date_format_(v, fmt):
        d = _parse_dt(v)
        if not d:
            return None
        py_fmt = str(fmt).replace("%i", "%M").replace("%s", "%S")
        return d.strftime(py_fmt)

    conn.create_function("YEAR", 1, year_)
    conn.create_function("MONTH", 1, month_)
    conn.create_function("HOUR", 1, hour_)
    conn.create_function("DATEDIFF", 2, datediff_)
    conn.create_function("DATE_FORMAT", 2, date_format_)


def _sql(sql: str) -> str:
    q = sql
    q = q.replace("IFNULL(", "COALESCE(")
    q = q.replace("%s", "?")
    q = q.replace("CURDATE() - INTERVAL 6 DAY", "date('now', '-6 day')")
    q = q.replace("CURDATE() - INTERVAL 14 DAY", "date('now', '-14 day')")
    q = q.replace("CURDATE() - INTERVAL 30 DAY", "date('now', '-30 day')")
    return q


class CursorWrap:
    def __init__(self, cur):
        self.cur = cur

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.cur.close()

    def execute(self, sql, params=None):
        if params is None:
            self.cur.execute(_sql(sql))
        else:
            self.cur.execute(_sql(sql), params)
        return self

    def executemany(self, sql, params_list):
        self.cur.executemany(_sql(sql), params_list)
        return self

    def fetchone(self):
        r = self.cur.fetchone()
        return dict(r) if r is not None else None

    def fetchall(self):
        return [dict(x) for x in self.cur.fetchall()]


class ConnWrap:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return CursorWrap(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_conn():
    db_path = Path(os.getenv("SQLITE_PATH", str(Path(__file__).resolve().parent / "data" / "tea_shop.db")))
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    _register_functions(conn)
    conn.executescript(SCHEMA)
    return ConnWrap(conn)
