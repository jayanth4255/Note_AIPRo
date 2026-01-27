from sqlalchemy import create_engine, text
from app.config import get_settings

def check_db():
    settings = get_settings()
    engine = create_engine(settings.database_url_validated)
    with engine.connect() as conn:
        # Check all notes
        result = conn.execute(text("SELECT id, title, is_deleted, user_id FROM notes"))
        print("ALL NOTES:")
        for row in result:
            print(row)
        
        # Check deleted notes
        result = conn.execute(text("SELECT id, title, is_deleted, user_id FROM notes WHERE is_deleted = true"))
        print("\nDELETED NOTES:")
        for row in result:
            print(row)

if __name__ == "__main__":
    check_db()
