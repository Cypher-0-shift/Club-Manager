import os
from supabase import create_client

def seed():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    url = ""
    key = ""
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="):
                url = line.strip().split("=", 1)[1]
            if line.startswith("SUPABASE_SERVICE_KEY="):
                key = line.strip().split("=", 1)[1]
    
    if not url or not key:
        print("Could not find SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        return
        print("Could not find SUPABASE_SERVICE_KEY")
        return

    sb = create_client(url, key)

    users_to_create = [
        {"email": "admin@clubmanager.demo", "password": "password123", "full_name": "Admin User", "role": "president"},
        {"email": "member@clubmanager.demo", "password": "password123", "full_name": "Alex Member", "role": "member"}
    ]

    for u in users_to_create:
        # Create in auth.users
        try:
            res = sb.auth.admin.create_user({
                "email": u["email"],
                "password": u["password"],
                "email_confirm": True
            })
            user_id = res.user.id
            print(f"Created auth.user: {user_id}")
            
            # Create in public.users
            sb.table("users").upsert({
                "id": user_id,
                "email": u["email"],
                "full_name": u["full_name"],
                "role": u["role"],
                "is_approved": True
            }).execute()
            print(f"Created public.user: {user_id}")
            
            # Print the ID out to a file so frontend can use it!
            with open(os.path.join(os.path.dirname(__file__), "mock_ids.txt"), "a") as out:
                out.write(f"{u['role']}={user_id}\n")

        except Exception as e:
            # Maybe already exists
            print(f"User {u['email']} might already exist. Fetching id...")
            # We can't fetch by email easily via admin, so let's check public.users
            res = sb.table("users").select("id").eq("email", u["email"]).execute()
            if res.data:
                user_id = res.data[0]["id"]
                with open(os.path.join(os.path.dirname(__file__), "mock_ids.txt"), "a") as out:
                    out.write(f"{u['role']}={user_id}\n")
            else:
                print("Error:", e)

if __name__ == "__main__":
    open(os.path.join(os.path.dirname(__file__), "mock_ids.txt"), "w").close() # Clear file
    seed()
