
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def fix_president(new_president_email):
    # 1. Find the current president
    res = supabase.table("users").select("id", "email").eq("role", "president").execute()
    if res.data:
        old_pres = res.data[0]
        print(f"Demoting current president: {old_pres['email']}")
        supabase.table("users").update({"role": "vp"}).eq("id", old_pres["id"]).execute()
    
    # 2. Promote the new user
    print(f"Promoting {new_president_email} to president and approving.")
    res = supabase.table("users").update({"is_approved": True, "role": "president"}).eq("email", new_president_email).execute()
    if res.data:
        print("Success!")
    else:
        print(f"User {new_president_email} not found.")

if __name__ == "__main__":
    fix_president("sinhatushar06@gmail.com")
