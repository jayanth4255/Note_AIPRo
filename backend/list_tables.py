import sqlite3
import os

db_path = "notes.db"
if not os.path.exists(db_path):
    print(f"Database file {db_path} not found.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables found in database:")
        for t in tables:
            print(f"- {t[0]}")
        conn.close()
    except Exception as e:
        print(f"Error reading database: {e}")
