import os
from supabase import create_client

def create_president():
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

    sb = create_client(url, key)

    email = "admin@test.com"
    password = "password123"
    full_name = "Rohit President"

    try:
        # Create in auth.users (admin API bypasses email limits)
        res = sb.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name}
        })
        user_id = res.user.id
        print(f"Created auth.user: {user_id}")
        
        # Create in public.users
        sb.table("users").upsert({
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": "president",
            "is_approved": True
        }).execute()
        print(f"Created public.user: {user_id} as President! ✅")
        print(f"\nLogin now with:\nEmail: {email}\nPassword: {password}")

    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    create_president()
