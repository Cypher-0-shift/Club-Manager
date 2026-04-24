"""
Domain Access Dependencies - Reusable domain validation logic
"""
from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from typing import Optional


EXEC_ROLES = ("president", "vp", "secretary")


async def require_domain_access(domain_id: str, current_user: dict = Depends(get_current_user)):
    """
    Dependency that validates user has access to a specific domain.
    
    PHASE 2: Extracted from permissions.py for reusability.
    
    Access rules:
    - Presidents: Access to all domains
    - VPs/Secretaries: Access to all domains (if they have org-wide permissions)
    - Leads: Access only to their assigned domain
    - Members: Access only to their assigned domain
    
    Args:
        domain_id: Domain ID to check access for
        current_user: Current authenticated user (injected)
        
    Raises:
        HTTPException: 403 if user doesn't have access to the domain
    """
    # Presidents always have access
    if current_user["role"] == "president":
        return
    
    # VPs and Secretaries have org-wide access
    if current_user["role"] in ("vp", "secretary"):
        return
    
    # Leads and Members can only access their own domain
    user_domain = current_user.get("domain_id")
    if user_domain != domain_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted to your domain. Required: {domain_id}, Your domain: {user_domain}"
        )


async def get_project_with_domain_check(
    project_id: str, 
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency that fetches a project and validates domain access.
    
    PHASE 2: Extracted from permissions.py for reusability.
    
    Args:
        project_id: Project ID to fetch
        current_user: Current authenticated user (injected)
        
    Returns:
        Project dictionary
        
    Raises:
        HTTPException: 404 if project not found, 403 if no access
    """
    sb = get_supabase_admin()
    proj = sb.table("projects").select("*").eq("id", project_id).single().execute()
    
    if not proj.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Project not found"
        )
    
    # Validate domain access
    await require_domain_access(proj.data["domain_id"], current_user)
    
    return proj.data


async def get_task_with_domain_check(
    task_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency that fetches a task and validates domain access.
    
    PHASE 2: New helper for task operations.
    
    Args:
        task_id: Task ID to fetch
        current_user: Current authenticated user (injected)
        
    Returns:
        Task dictionary
        
    Raises:
        HTTPException: 404 if task not found, 403 if no access
    """
    sb = get_supabase_admin()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    
    if not task.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Members can only access their own tasks
    if current_user["role"] == "member":
        if task.data.get("assignee_id") != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your assigned tasks"
            )
    else:
        # Leads and above: validate domain access
        task_domain = task.data.get("domain_id")
        if task_domain:
            await require_domain_access(task_domain, current_user)
    
    return task.data


def validate_user_can_manage_domain(
    domain_id: Optional[str],
    current_user: dict
) -> bool:
    """
    Check if user can manage a specific domain.
    
    Args:
        domain_id: Domain ID to check (None = org-wide)
        current_user: Current user dict
        
    Returns:
        True if user can manage, False otherwise
    """
    # Presidents can manage all domains
    if current_user["role"] == "president":
        return True
    
    # VPs and Secretaries can manage all domains
    if current_user["role"] in ("vp", "secretary"):
        return True
    
    # Leads can only manage their own domain
    if current_user["role"] == "lead":
        return domain_id == current_user.get("domain_id")
    
    # Members cannot manage domains
    return False
