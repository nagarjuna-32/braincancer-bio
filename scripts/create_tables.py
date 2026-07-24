import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

def main():
    print("==========================================================")
    print("      NeuroGen AI - Database Initialization Tool          ")
    print("==========================================================")
    
    db_url = os.getenv("DATABASE_URL", "sqlite:///./neurogen.db")
    print(f"Connecting to database at: {db_url}")
    
    try:
        from app.database import init_db
        init_db()
        print("\n[Success] All database tables created successfully!")
    except Exception as e:
        print("\n[Error] Failed to initialize database tables:")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
