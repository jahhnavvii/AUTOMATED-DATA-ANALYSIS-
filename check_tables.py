import sqlite3
import os

db_path = r"c:\Users\nagar\Desktop\auto ds\autods.db"
if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables in {db_path}: {[t[0] for t in tables]}")
    conn.close()
