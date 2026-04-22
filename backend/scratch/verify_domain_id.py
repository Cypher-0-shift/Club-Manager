import os
from supabase import create_client

def verify():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    sb = create_client(url, key)
    
    # Try to find a valid domain ID first
    domains = sb.table("domains").select("id").limit(1).execute()
    if not domains.data:
        print("No domains found to test with")
        return
    
    dom_id = domains.data[0]["id"]
    print(f"Testing insertion with domain_id: {dom_id}")
    
    try:
        # Try to insert a dummy task with domain_id
        res = sb.table("tasks").insert({
            "title": "Schema Test Task",
            "domain_id": dom_id,
            "status": "pending",
            "priority": "low"
        }).execute()
        print("Success! Column exists.")
        # Cleanup
        if res.data:
            sb.table("tasks").delete().eq("id", res.data[0]["id"]).execute()
    except Exception as e:
        print("Failed as expected or unexpected error:", e)

if __name__ == "__main__":
    verify()
