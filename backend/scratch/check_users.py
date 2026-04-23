
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_users():
    res = supabase.table("users").select("*").execute()
    print(f"Total users: {len(res.data)}")
    for user in res.data:
        print(f"ID: {user['id']}, Role: {user.get('role')}, Approved: {user.get('is_approved')}, Email: {user.get('email')}")

if __name__ == "__main__":
    check_users()
