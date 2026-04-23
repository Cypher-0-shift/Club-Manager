
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def set_role(email, role):
    res = supabase.table("users").update({"role": role, "is_approved": True}).eq("email", email).execute()
    if res.data:
        print(f"User {email} updated to {role} and approved.")
    else:
        print(f"User {email} not found.")

if __name__ == "__main__":
    set_role("sinhatushar06@gmail.com", "member")
