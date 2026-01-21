# backend/app/migrate_db.py
"""
Script to add privacy columns to existing database
"""
import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'notes.db')

print(f"Migrating database at: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Add new columns to notes table
    print("Adding is_hidden column...")
    cursor.execute("ALTER TABLE notes ADD COLUMN is_hidden INTEGER DEFAULT 0")
    
    print("Adding is_locked column...")
    cursor.execute("ALTER TABLE notes ADD COLUMN is_locked INTEGER DEFAULT 0")
    
    print("Adding lock_pin_hash column...")
    cursor.execute("ALTER TABLE notes ADD COLUMN lock_pin_hash VARCHAR(255)")
    
    # Commit changes
    conn.commit()
    print("✅ Database migration completed successfully!")
    
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e):
        print("⚠️  Columns already exist, skipping migration.")
    else:
        print(f"❌ Error: {e}")
        raise

finally:
    conn.close()
