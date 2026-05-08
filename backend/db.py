# backend/db.py
import pymysql

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