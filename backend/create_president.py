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
        # Check if user already exists in auth
        # Note: list_users is paged, so we filter by email if possible or just try-catch
        user_id = None
        
        # We try to create first, but if it fails we find the user
        try:
            res = sb.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name}
            })
            user_id = res.user.id
            print(f"Created new auth.user: {user_id}")
        except Exception as e:
            if "already been registered" in str(e):
                print(f"User {email} already exists in Auth. Linking...")
                # Fetch existing user
                users_list = sb.auth.admin.list_users()
                existing_user = next((u for u in users_list if u.email == email), None)
                if existing_user:
                    user_id = existing_user.id
                else:
                    raise Exception(f"Could not find existing user {email} even though Auth said it exists.")
            else:
                raise e

        if user_id:
            # Upsert in public.users to ensure role is correct
            sb.table("users").upsert({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": "president",
                "is_approved": True
            }).execute()
            print(f"Updated public.user: {user_id} as President! [OK]")
            print(f"\nDetails:\nEmail: {email}\nPassword: {password}")
        
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    create_president()
