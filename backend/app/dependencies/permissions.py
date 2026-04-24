from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
import json
import os

def get_permissions_data():
    file_path = "permissions.json"
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def has_permission(action_name: str, user_role: str) -> bool:
    perms = get_permissions_data()
    role_key = user_role
    # Map role names to matrix column keys if necessary
    if user_role in ["vp", "secretary"]:
        role_key = "vp_sec"
    
    for row in perms:
        if row["action"] == action_name:
            val = row.get(role_key, "—")
            return val == "✓" or val == "◑"
    return False

def require_domain_access(domain_id: str, current_user: dict):
    """Raises 403 if user tries to access a domain they don't own, unless permitted by matrix."""
    # President always has access
    if current_user["role"] == "president":
        return

    # Check if they have general domain access permission (Manage Domains or similar)
    # But usually this check is for domain-specific context (e.g. lead of Design seeing Design)
    
    if current_user.get("domain_id") != domain_id:
        # Check if their role allows org-wide management
        if not has_permission("Manage Org-wide Users", current_user["role"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to your domain")

async def get_project_with_domain_check(project_id: str, current_user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    sb = get_supabase_admin()
    proj = sb.table("projects").select("*").eq("id", project_id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_domain_access(proj.data["domain_id"], current_user)
    return proj.data
