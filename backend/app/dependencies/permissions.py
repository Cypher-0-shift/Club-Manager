from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user

def require_domain_access(domain_id: str, current_user: dict):
    """Raises 403 if a lead tries to access a domain they don't own."""
    EXEC_ROLES = ("president", "vp", "secretary")
    if current_user["role"] not in EXEC_ROLES:
        if current_user.get("domain_id") != domain_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to your domain")

async def get_project_with_domain_check(project_id: str, current_user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    sb = get_supabase_admin()
    proj = sb.table("projects").select("*").eq("id", project_id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    require_domain_access(proj.data["domain_id"], current_user)
    return proj.data
