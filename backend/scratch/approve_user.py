
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def approve_user(email):
    res = supabase.table("users").update({"is_approved": True, "role": "president"}).eq("email", email).execute()
    if res.data:
        print(f"User {email} approved as president.")
    else:
        print(f"User {email} not found or update failed.")

if __name__ == "__main__":
    approve_user("sinhatushar06@gmail.com")
