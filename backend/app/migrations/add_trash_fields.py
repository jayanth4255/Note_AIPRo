"""
Migration script to add trash functionality fields to notes table
Run this script to update your existing database with the new trash fields
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.config import get_settings

def migrate_trash_fields():
    """Add is_deleted and deleted_at fields to notes table"""
    settings = get_settings()
    engine = create_engine(settings.database_url_validated)
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='notes' AND column_name IN ('is_deleted', 'deleted_at')
            """))
            existing_columns = [row[0] for row in result]
            
            # Add is_deleted column if it doesn't exist
            if 'is_deleted' not in existing_columns:
                print("Adding is_deleted column...")
                conn.execute(text("""
                    ALTER TABLE notes 
                    ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                print("✓ is_deleted column added successfully")
            else:
                print("✓ is_deleted column already exists")
            
            # Add deleted_at column if it doesn't exist
            if 'deleted_at' not in existing_columns:
                print("Adding deleted_at column...")
                conn.execute(text("""
                    ALTER TABLE notes 
                    ADD COLUMN deleted_at TIMESTAMP
                """))
                conn.commit()
                print("✓ deleted_at column added successfully")
            else:
                print("✓ deleted_at column already exists")
            
            print("\n✅ Migration completed successfully!")
            print("Your database now supports trash functionality.")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("NoteAI Pro - Trash Functionality Migration")
    print("=" * 60)
    print("\nThis will add trash functionality to your database.")
    print("The following columns will be added to the notes table:")
    print("  - is_deleted (BOOLEAN)")
    print("  - deleted_at (TIMESTAMP)")
    print("\nStarting migration...\n")
    
    migrate_trash_fields()
