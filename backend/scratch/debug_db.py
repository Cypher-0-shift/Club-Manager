import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def debug():
    print("--- Auth Users Raw ---")
    try:
        auth_res = supabase.auth.admin.list_users()
        print(f"Type of auth_res: {type(auth_res)}")
        print(f"Attributes of auth_res: {dir(auth_res)}")
        
        # In newer versions, it might be a list directly or have a 'users' attribute
        users = []
        if isinstance(auth_res, list):
            users = auth_res
        elif hasattr(auth_res, 'users'):
            users = auth_res.users
        else:
            print(f"Unknown structure: {auth_res}")
            
        print(f"Count: {len(users)}")
        for u in users:
            # Handle both object and dict
            u_email = u.email if hasattr(u, 'email') else u.get('email')
            u_id = u.id if hasattr(u, 'id') else u.get('id')
            print(f"ID: {u_id}, Email: {u_email}")
            
    except Exception as e:
        print(f"Error listing auth users: {e}")

if __name__ == "__main__":
    debug()
