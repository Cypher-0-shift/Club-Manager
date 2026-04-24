import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Fixed UUIDs for consistency
ORG_ID = "aaaaaaaa-0000-0000-0000-000000000001"
DOMAINS = {
    "Tech": "aaaaaaaa-0000-0000-0000-000000000040",
    "Design": "aaaaaaaa-0000-0000-0000-000000000041",
    "Marketing": "aaaaaaaa-0000-0000-0000-000000000042",
    "Events": "aaaaaaaa-0000-0000-0000-000000000043",
}

USERS_DATA = [
    {"email": "president@nexus.com", "name": "Alex Rivera", "role": "president", "domain": None, "id": "aaaaaaaa-0000-0000-0000-000000000010"},
    {"email": "sam@nexus.com", "name": "Sam Chen", "role": "lead", "domain": "Tech", "id": "aaaaaaaa-0000-0000-0000-000000000020"},
    {"email": "priya@nexus.com", "name": "Priya Patel", "role": "lead", "domain": "Design", "id": "aaaaaaaa-0000-0000-0000-000000000021"},
    {"email": "jordan@nexus.com", "name": "Jordan Smith", "role": "lead", "domain": "Marketing", "id": "aaaaaaaa-0000-0000-0000-000000000022"},
    {"email": "morgan@nexus.com", "name": "Morgan Lee", "role": "lead", "domain": "Events", "id": "aaaaaaaa-0000-0000-0000-000000000023"},
    {"email": "member1@nexus.com", "name": "Riley Kumar", "role": "member", "domain": "Tech", "id": "aaaaaaaa-0000-0000-0000-000000000030"},
    {"email": "member2@nexus.com", "name": "Casey Wong", "role": "member", "domain": "Design", "id": "aaaaaaaa-0000-0000-0000-000000000031"},
    {"email": "member3@nexus.com", "name": "Drew Patel", "role": "member", "domain": "Marketing", "id": "aaaaaaaa-0000-0000-0000-000000000032"},
]

def seed():
    print("Starting Demo Data Seed...")

    # 1. Create Organization
    print(f"Creating Organization: Nexus Club...")
    supabase.table("organizations").upsert({
        "id": ORG_ID,
        "name": "Nexus Club",
        "join_code": "NEXUS001"
    }).execute()

    # 2. Create Domains
    print("Creating Domains...")
    for name, d_id in DOMAINS.items():
        supabase.table("domains").upsert({
            "id": d_id,
            "name": name,
            "org_id": ORG_ID,
            "color_hex": "#0ea5e9" if name == "Tech" else "#ec4899" if name == "Design" else "#f59e0b" if name == "Marketing" else "#10b981"
        }).execute()

    # Get existing auth users once
    print("Fetching existing auth users...")
    existing_auth_users = {}
    try:
        auth_res = supabase.auth.admin.list_users()
        users_list = auth_res if isinstance(auth_res, list) else getattr(auth_res, 'users', [])
        
        for u in users_list:
            u_email = getattr(u, 'email', None) or u.get('email')
            u_id = getattr(u, 'id', None) or u.get('id')
            if u_email:
                existing_auth_users[u_email] = u_id
    except Exception as e:
        print(f"  Warning: Could not list auth users: {e}")
            
    print(f"  Found {len(existing_auth_users)} existing auth users.")

    # 3. Create Auth Users and Profiles
    user_map = {} # email -> user_id
    print("Creating Users (Auth + Profiles)...")
    for user_info in USERS_DATA:
        email = user_info["email"]
        fixed_id = user_info["id"]
        print(f"  Processing {email}...")
        
        user_id = existing_auth_users.get(email)
        
        if not user_id:
            # Fallback: Check public.users table if not in auth list
            # This handles cases where manual SQL seed was used or auth list is inconsistent
            try:
                public_user = supabase.table("users").select("id").eq("email", email).execute()
                if public_user.data:
                    user_id = public_user.data[0]["id"]
                    print(f"    User found in public.users: {user_id}")
            except Exception as e:
                print(f"    Warning: Could not check public.users for {email}: {e}")

        if user_id:
            print(f"    User identified: {user_id}")
        else:
            try:
                print(f"    Creating new Auth User...")
                new_user_res = supabase.auth.admin.create_user({
                    "email": email,
                    "password": "Demo@1234",
                    "email_confirm": True,
                    "user_metadata": {"full_name": user_info["name"]}
                })
                user_id = getattr(new_user_res, 'id', None) or (new_user_res.user.id if hasattr(new_user_res, 'user') else None)
                if not user_id and isinstance(new_user_res, dict):
                    user_id = new_user_res.get('id')
                
                print(f"    Created: {user_id}")
            except Exception as e:
                # If we get a "Database error" or "User already exists", try to delete by fixed ID and retry
                # But only if not referenced by projects/tasks (we already know this might fail)
                if "Database error" in str(e) or "already exists" in str(e):
                    print(f"    Conflict detected for {email}. Trying aggressive cleanup...")
                    try:
                        # Attempt to delete from auth by fixed_id as a last resort
                        supabase.auth.admin.delete_user(fixed_id)
                        print(f"    Cleanup successful. Retrying...")
                        new_user_res = supabase.auth.admin.create_user({
                            "email": email,
                            "password": "Demo@1234",
                            "email_confirm": True,
                            "user_metadata": {"full_name": user_info["name"]}
                        })
                        user_id = getattr(new_user_res, 'id', None) or (new_user_res.user.id if hasattr(new_user_res, 'user') else None)
                    except Exception as retry_e:
                        print(f"    Final attempt failed for {email}: {retry_e}")
                        continue
                else:
                    print(f"    Error for {email}: {e}")
                    continue


        
        if not user_id:
            continue

        user_map[email] = user_id

        # Create/Update Public Profile
        try:
            profile_data = {
                "id": user_id,
                "email": email,
                "full_name": user_info["name"],
                "role": user_info["role"],
                "org_id": ORG_ID,
                "is_approved": True
            }
            if user_info["domain"]:
                profile_data["domain_id"] = DOMAINS[user_info["domain"]]
            
            # Use upsert on ID
            supabase.table("users").upsert(profile_data).execute()
            print(f"    Profile synced: {user_info['name']}")
        except Exception as e:
            print(f"    Profile sync error for {email}: {e}")


    # 4. Create Projects
    print("Creating Projects...")
    projects_data = [
        {"id": "aaaaaaaa-0000-0000-0000-000000000050", "name": "Next-Gen Portal", "desc": "Building main platform", "domain": "Tech", "by": "sam@nexus.com"},
        {"id": "aaaaaaaa-0000-0000-0000-000000000051", "name": "Brand Identity 2024", "desc": "Refreshing visual assets", "domain": "Design", "by": "priya@nexus.com"},
        {"id": "aaaaaaaa-0000-0000-0000-000000000052", "name": "Spring Recruitment", "desc": "Campaign for 50+ members", "domain": "Marketing", "by": "jordan@nexus.com"},
        {"id": "aaaaaaaa-0000-0000-0000-000000000053", "name": "Annual Hackathon", "desc": "Planning tech event", "domain": "Events", "by": "morgan@nexus.com"},
    ]
    
    for p in projects_data:
        creator_id = user_map.get(p["by"])
        if creator_id:
            supabase.table("projects").upsert({
                "id": p["id"],
                "name": p["name"],
                "description": p["desc"],
                "domain_id": DOMAINS[p["domain"]],
                "created_by": creator_id,
                "org_id": ORG_ID
            }).execute()

    # 5. Create Tasks
    print("Creating Tasks...")
    tasks_data = [
        {"title": "Fix Supabase Auth Flow", "p": "critical", "s": "in_progress", "proj": projects_data[0]["id"], "dom": "Tech", "by": "sam@nexus.com", "to": "sam@nexus.com"},
        {"title": "Landing Page Hero Section", "p": "high", "s": "completed", "proj": projects_data[0]["id"], "dom": "Tech", "by": "sam@nexus.com", "to": "member1@nexus.com"},
        {"title": "Logo Vectorization", "p": "high", "s": "completed", "proj": projects_data[1]["id"], "dom": "Design", "by": "priya@nexus.com", "to": "member2@nexus.com"},
        {"title": "Instagram Launch Post", "p": "high", "s": "completed", "proj": projects_data[2]["id"], "dom": "Marketing", "by": "jordan@nexus.com", "to": "member3@nexus.com"},
        {"title": "Venue Booking", "p": "critical", "s": "completed", "proj": projects_data[3]["id"], "dom": "Events", "by": "morgan@nexus.com", "to": "morgan@nexus.com"},
    ]

    for t in tasks_data:
        creator_id = user_map.get(t["by"])
        assignee_id = user_map.get(t["to"])
        if creator_id and assignee_id:
            supabase.table("tasks").upsert({
                "title": t["title"],
                "priority": t["p"],
                "status": t["s"],
                "project_id": t["proj"],
                "domain_id": DOMAINS[t["dom"]],
                "created_by": creator_id,
                "assignee_id": assignee_id,
                "org_id": ORG_ID
            }).execute()

    print("\nSeed Complete! You can now login with:")
    print("   Email: president@nexus.com")
    print("   Pass:  Demo@1234")

if __name__ == "__main__":
    seed()
