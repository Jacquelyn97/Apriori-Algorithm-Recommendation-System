# backend/db.py
import os
import pymysql

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "tea_shop"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}

def get_conn():
    return pymysql.connect(
        host="127.0.0.1",
        port=3307,               # 按你的配置改 / Adjust based on your local DB config
        user="root",
        password="123456",
        database="tea_shop",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
