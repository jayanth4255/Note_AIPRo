from sqlalchemy import create_engine, text
from app.config import get_settings

def check_db_state():
    settings = get_settings()
    engine = create_engine(settings.database_url_validated)
    with engine.connect() as conn:
        # Check users
        result = conn.execute(text("SELECT id, email, name FROM users"))
        print("USERS:")
        for row in result:
            print(row)
            
        # Check file attachments
        result = conn.execute(text("SELECT id, filename, note_id FROM file_attachments"))
        print("\nFILE ATTACHMENTS:")
        for row in result:
            print(row)
            
        # Check notes
        result = conn.execute(text("SELECT id, title, user_id FROM notes"))
        print("\nNOTES:")
        for row in result:
            print(row)

if __name__ == "__main__":
    check_db_state()
