from sqlalchemy import text
from .database import engine

print(f"Migrating database: {engine.url}")

try:
    with engine.connect() as conn:
        # Add is_trash column to notes table
        print("Adding is_trash column if it doesn't exist...")
        # Check if column exists first (PostgreSQL specific way)
        check_query = text("""
            SELECT count(*) 
            FROM information_schema.columns 
            WHERE table_name='notes' AND column_name='is_trash';
        """)
        result = conn.execute(check_query).scalar()
        
        if result == 0:
            print("Adding column...")
            conn.execute(text("ALTER TABLE notes ADD COLUMN is_trash BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("✅ Database migration completed successfully!")
        else:
            print("⚠️  Column 'is_trash' already exists, skipping migration.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    raise
