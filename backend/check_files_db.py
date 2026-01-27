from sqlalchemy import create_engine, text
from app.config import get_settings

def check_files():
    settings = get_settings()
    engine = create_engine(settings.database_url_validated)
    with engine.connect() as conn:
        # Check all file attachments
        result = conn.execute(text("SELECT id, filename, note_id, user_id FROM file_attachments"))
        print("FILE ATTACHMENTS:")
        for row in result:
            print(row)
        
        # Check notes for these files
        result = conn.execute(text("SELECT id, title, user_id FROM notes"))
        print("\nNOTES:")
        for row in result:
            print(row)

if __name__ == "__main__":
    check_files()
