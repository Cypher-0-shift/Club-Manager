import os
import datetime
from supabase import create_client

def seed():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://hchuakyxonporwheykot.supabase.co")
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    key = ""
    
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_KEY="):
                    key = line.strip().split("=", 1)[1]
    
    if not key:
        print("Could not find SUPABASE_SERVICE_KEY in .env. Ensure it is set.")
        return

    sb = create_client(url, key)
    print("Connected to Supabase...")

    # 1. DOMAINS
    domains_data = [
        {"name": "Development", "description": "Engineering and Tech", "color_hex": "#3b82f6"},
        {"name": "PR", "description": "Public Relations and Comms", "color_hex": "#10b981"},
        {"name": "Marketing", "description": "Marketing and Strategy", "color_hex": "#f59e0b"},
        {"name": "Design", "description": "UI/UX and Graphic Design", "color_hex": "#ec4899"}
    ]
    
    domain_ids = {}
    print("Seeding Domains...")
    for d in domains_data:
        try:
            # We fetch first to prevent duplication errors if already exist
            res = sb.table("domains").select("id").eq("name", d["name"]).execute()
            if res.data:
                domain_ids[d["name"]] = res.data[0]["id"]
            else:
                res_ins = sb.table("domains").insert(d).execute()
                domain_ids[d["name"]] = res_ins.data[0]["id"]
        except Exception as e:
            print(f"Error processing domain {d['name']}: {e}")

    # 2. USERS
    users_to_create = [
        {"email": "president@demo.com", "full_name": "Genesis President", "role": "president", "domain": None},
        {"email": "dev.lead@demo.com", "full_name": "Alice DevLead", "role": "lead", "domain": "Development"},
        {"email": "pr.lead@demo.com", "full_name": "Bob PRLead", "role": "lead", "domain": "PR"},
        {"email": "mktg.lead@demo.com", "full_name": "Charlie MktgLead", "role": "lead", "domain": "Marketing"},
        {"email": "design.lead@demo.com", "full_name": "Diana DesignLead", "role": "lead", "domain": "Design"},
        {"email": "dev.member1@demo.com", "full_name": "Eve Coder", "role": "member", "domain": "Development"},
        {"email": "dev.member2@demo.com", "full_name": "Frank Hacker", "role": "member", "domain": "Development"},
        {"email": "design.member@demo.com", "full_name": "Grace Artist", "role": "member", "domain": "Design"}
    ]

    user_ids = {}
    password = "DemoPass123!"
    
    print("Seeding Users...")
    for u in users_to_create:
        try:
            res = sb.auth.admin.create_user({
                "email": u["email"],
                "password": password,
                "email_confirm": True
            })
            uid = res.user.id
            print(f"Created auth user: {u['email']} with ID: {uid}")
        except Exception as e:
            print(f"User {u['email']} might already exist. Fetching id...")
            res = sb.table("users").select("id").eq("email", u["email"]).execute()
            if res.data:
                uid = res.data[0]["id"]
            else:
                print("Failed to get ID for", u['email'])
                continue

        user_ids[u["email"]] = uid
        
        # Upsert into public.users
        dom_id = domain_ids[u["domain"]] if u["domain"] else None
        sb.table("users").upsert({
            "id": uid,
            "email": u["email"],
            "full_name": u["full_name"],
            "role": u["role"],
            "domain_id": dom_id,
            "is_approved": True
        }).execute()
        
    # 3. PROJECTS
    projects_data = [
        {"name": "Core API V2", "description": "Upgrading legacy API.", "domain_name": "Development", "creator_email": "dev.lead@demo.com"},
        {"name": "Q3 Campaign Launch", "description": "Press release Q3", "domain_name": "PR", "creator_email": "pr.lead@demo.com"},
        {"name": "Brand Refresh", "description": "SEO Strategy", "domain_name": "Marketing", "creator_email": "mktg.lead@demo.com"},
        {"name": "UI Kit Overhaul", "description": "Updating components.", "domain_name": "Design", "creator_email": "design.lead@demo.com"}
    ]

    project_ids = {}
    print("Seeding Projects...")
    for p in projects_data:
        res = sb.table("projects").select("id").eq("name", p["name"]).execute()
        if res.data:
            project_ids[p["name"]] = res.data[0]["id"]
        else:
            dom_id = domain_ids[p["domain_name"]]
            creator_id = user_ids[p["creator_email"]]
            res_ins = sb.table("projects").insert({
                "name": p["name"],
                "description": p["description"],
                "domain_id": dom_id,
                "created_by": creator_id
            }).execute()
            project_ids[p["name"]] = res_ins.data[0]["id"]

    # 4. TASKS
    now = datetime.datetime.now(datetime.timezone.utc)
    tasks_data = [
        {"title": "Fix Authentication Bug", "desc": "Random logouts.", "status": "in_progress", "priority": "critical", "days_offset": -2, "is_overdue": True, "proj": "Core API V2", "assignee": "dev.member1@demo.com", "creator": "dev.lead@demo.com"},
        {"title": "Setup CI/CD Pipeline", "desc": "GitHub Actions", "status": "pending", "priority": "high", "days_offset": 3, "is_overdue": False, "proj": "Core API V2", "assignee": "dev.member2@demo.com", "creator": "dev.lead@demo.com"},
        {"title": "Write Unit Tests for Router", "desc": "80% coverage.", "status": "completed", "priority": "medium", "days_offset": -5, "is_overdue": False, "proj": "Core API V2", "assignee": "dev.member2@demo.com", "creator": "dev.lead@demo.com"},
        {"title": "Draft Press Release", "desc": "Initial draft.", "status": "pending", "priority": "medium", "days_offset": 7, "is_overdue": False, "proj": "Q3 Campaign Launch", "assignee": "pr.lead@demo.com", "creator": "pr.lead@demo.com"},
        {"title": "SEO Audit", "desc": "Lighthouse audits.", "status": "in_progress", "priority": "high", "days_offset": 2, "is_overdue": False, "proj": "Brand Refresh", "assignee": "mktg.lead@demo.com", "creator": "mktg.lead@demo.com"},
        {"title": "Finalize Logo Concepts", "desc": "Review options.", "status": "pending", "priority": "critical", "days_offset": -1, "is_overdue": True, "proj": "UI Kit Overhaul", "assignee": "design.member@demo.com", "creator": "design.lead@demo.com"},
        {"title": "Create Dashboard Mockups", "desc": "Figma mockups.", "status": "completed", "priority": "medium", "days_offset": -4, "is_overdue": False, "proj": "UI Kit Overhaul", "assignee": "design.member@demo.com", "creator": "design.lead@demo.com"}
    ]

    print("Seeding Tasks...")
    for t in tasks_data:
        res = sb.table("tasks").select("id").eq("title", t["title"]).execute()
        if not res.data:
            deadline = (now + datetime.timedelta(days=t["days_offset"])).isoformat()
            sb.table("tasks").insert({
                "title": t["title"],
                "description": t["desc"],
                "status": t["status"],
                "priority": t["priority"],
                "deadline": deadline,
                "is_overdue": t["is_overdue"],
                "project_id": project_ids[t["proj"]],
                "assignee_id": user_ids[t["assignee"]],
                "created_by": user_ids[t["creator"]]
            }).execute()
    
    print("Seed completed successfully!")

if __name__ == "__main__":
    seed()
