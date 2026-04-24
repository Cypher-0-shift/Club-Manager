import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

FIXED_IDS = [
    "aaaaaaaa-0000-0000-0000-000000000010",
    "aaaaaaaa-0000-0000-0000-000000000020",
    "aaaaaaaa-0000-0000-0000-000000000021",
    "aaaaaaaa-0000-0000-0000-000000000022",
    "aaaaaaaa-0000-0000-0000-000000000023",
    "aaaaaaaa-0000-0000-0000-000000000030",
    "aaaaaaaa-0000-0000-0000-000000000031",
    "aaaaaaaa-0000-0000-0000-000000000032",
]

def full_reset():
    print("Starting Full Database Reset...")
    
    print("1. Deleting Tasks...")
    supabase.table("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    print("2. Deleting Projects...")
    supabase.table("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    print("3. Deleting Public Users...")
    supabase.table("users").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    print("4. Attempting to delete Auth Users by fixed IDs...")
    for uid in FIXED_IDS:
        try:
            supabase.auth.admin.delete_user(uid)
            print(f"   Deleted auth user: {uid}")
        except Exception as e:
            print(f"   Could not delete auth user {uid}: {e}")

    print("5. Listing remaining Auth Users...")
    try:
        auth_res = supabase.auth.admin.list_users()
        users = auth_res if isinstance(auth_res, list) else getattr(auth_res, 'users', [])
        for u in users:
            print(f"   Remaining Auth User: {u.id} ({u.email})")
            # Try to delete them too if they are nexus.com emails
            if u.email and "@nexus.com" in u.email:
                try:
                    supabase.auth.admin.delete_user(u.id)
                    print(f"   Deleted: {u.id}")
                except:
                    pass
    except Exception as e:
        print(f"   Error listing auth users: {e}")

    print("\nReset complete. Now run seed_demo.py again.")

if __name__ == "__main__":
    full_reset()
