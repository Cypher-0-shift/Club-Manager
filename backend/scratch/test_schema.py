import os
from supabase import create_client

def test():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    sb = create_client(url, key)
    
    try:
        res = sb.table("tasks").select("*").limit(1).execute()
        if res.data:
            print("Columns:", res.data[0].keys())
        else:
            print("No data in tasks table")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
