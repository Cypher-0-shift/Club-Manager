from fastapi import APIRouter, Depends, HTTPException, status, Body, Query, Request
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import UserUpdate, UserOut, UserCreate, OrganizationOut
from app.services.cache_service import CacheService
from app.security.sanitization import sanitize_text
from app.security.csrf import get_csrf_token
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

EXEC_ROLES = ("president", "vp", "secretary")

# Rate limiter for signup endpoint
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_user(request: Request, body: UserCreate):
    """
    Complete user profile after Supabase Auth signup.
    
    The handle_new_user() trigger already created a basic profile (as 'member'),
    so we UPDATE it with full details, promote to 'president' if needed, 
    and link to the newly created Organization and Domain.
    """
    # 1. Verify JWT token to ensure requester is the actual user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]
    
    sb = get_supabase_admin()
    
    try:
        user_res = sb.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        if user_res.user.id != body.id:
            raise HTTPException(status_code=403, detail="Token user ID mismatch")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth verification failed: {str(e)}")

    org_id = None
    domain_id = body.domain_id
    is_approved = False

    if body.role == "president":
        if not body.org_name:
            raise HTTPException(status_code=400, detail="Organization name is required for President signup")
        
        # Create organization
        import string
        import random
        join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        org_res = sb.table("organizations").insert({
            "name": body.org_name,
            "join_code": join_code
        }).execute()
        
        if not org_res.data:
            raise HTTPException(status_code=500, detail="Failed to create organization")
        
        org_id = org_res.data[0]["id"]
        is_approved = True  # President is auto-approved

        # Create default domain for the new organization
        domain_res = sb.table("domains").insert({
            "name": "General",
            "org_id": org_id,
            "description": "Primary organization domain",
            "color_hex": "#6366f1"
        }).execute()
        
        if domain_res.data:
            domain_id = domain_res.data[0]["id"]
    else:
        if not body.join_code:
            raise HTTPException(status_code=400, detail="Organization Join Code is required")
        
        # Find organization by join_code
        org_res = sb.table("organizations").select("id").eq("join_code", body.join_code.upper()).execute()
        if not org_res.data:
            raise HTTPException(status_code=404, detail="Invalid Organization Join Code")
        
        org_id = org_res.data[0]["id"]
        is_approved = False

    # Update the user profile created by handle_new_user() trigger
    # We forcefully promote them to 'president' if requested, now that org_id exists
    user_data = {
        "email": body.email,
        "full_name": sanitize_text(body.full_name, max_length=100),
        "role": body.role,
        "org_id": org_id,
        "domain_id": domain_id,
        "is_approved": is_approved
    }
    
    result = sb.table("users").update(user_data).eq("id", body.id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update user profile")
    
    return result.data[0]

@router.get("", response_model=list[UserOut])
async def list_users(
    is_approved: Optional[bool] = None,
    domain_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    query = sb.table("users").select("*").eq("org_id", current_user["org_id"])

    if is_approved is not None:
        query = query.eq("is_approved", is_approved)
    if domain_id:
        query = query.eq("domain_id", domain_id)

    # Non-exec users only see their own domain
    if current_user["role"] not in EXEC_ROLES:
        if current_user["role"] == "lead":
            query = query.eq("domain_id", current_user.get("domain_id"))
        else:
            query = query.eq("id", current_user["id"])

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return result.data or []


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.get("/csrf-token")
async def get_csrf_token_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Get a CSRF token for the current user.
    
    PHASE 3: Returns a signed CSRF token that must be included in
    X-CSRF-Token header for all state-changing requests.
    
    Returns:
        {"csrf_token": "..."}
    """
    token = get_csrf_token(current_user["id"])
    return {"csrf_token": token}


@router.get("/org", response_model=OrganizationOut)
async def get_my_org(current_user: dict = Depends(get_current_user)):
    """Get organization details for the current user."""
    sb = get_supabase_admin()
    result = sb.table("organizations").select("*").eq("id", current_user["org_id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return result.data

@router.get("/permissions")
async def get_permissions():
    """
    Get permissions matrix.
    
    PHASE 2: Added Redis caching with 5-minute TTL.
    """
    # Try cache first
    cached = await CacheService.get_permissions()
    if cached:
        return cached
    
    import json
    import os
    file_path = "permissions.json"
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Cache for 5 minutes
    await CacheService.set_permissions(data, ttl=300)
    
    return data


@router.patch("/permissions")
async def update_permissions(
    body: list = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Update permissions matrix.
    
    PHASE 2: Invalidates permissions cache after update.
    """
    if current_user["role"] != "president":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only president can update permissions")
    
    import json
    file_path = "permissions.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(body, f, indent=2, ensure_ascii=False)
    
    # Invalidate cache
    await CacheService.invalidate_permissions()
    
    return body



@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    target_user = sb.table("users").select("domain_id").eq("id", user_id).single().execute()
    if not target_user.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = body.model_dump(exclude_none=True)

    if user_id != current_user["id"]:
        if current_user["role"] not in ["president", "vp", "secretary", "lead"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted to update others")
        
        # Non-presidents can only update users in their own domain
        if current_user["role"] != "president":
            if target_user.data.get("domain_id") != current_user.get("domain_id"):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update users outside your domain")

    # Role changes
    if "role" in updates:
        if current_user["role"] != "president":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only president can change roles")
        if user_id == current_user["id"]:
            updates.pop("role")
            if not updates:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change your own role")

    # is_approved changes
    if "is_approved" in updates:
        if current_user["role"] not in ["president", "vp", "secretary", "lead"]:
            updates.pop("is_approved")

    # Non-execs cannot change domain_id
    if "domain_id" in updates and current_user["role"] not in EXEC_ROLES:
        updates.pop("domain_id")

    if not updates:
        return target_user.data

    result = sb.table("users").update(updates).eq("id", user_id).execute()
    return result.data[0]


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "president":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only president can delete members")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own president account")

    sb = get_supabase_admin()
    
    # Check if user exists
    target = sb.table("users").select("id").eq("id", user_id).single().execute()
    if not target.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Delete from auth.users via admin API if possible, but here we just delete from public.users
    # In a real app, you'd also delete the auth user.
    sb.table("users").delete().eq("id", user_id).execute()
    return None



@router.post("/request-deletion")
async def request_deletion(
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] == "president":
        raise HTTPException(status_code=400, detail="President cannot request deletion, use Delete Organization instead")
    
    sb = get_supabase_admin()
    
    # 1. Find the President
    presidents = sb.table("users").select("id").eq("role", "president").execute()
    if not presidents.data:
        raise HTTPException(status_code=500, detail="No president found to handle request")
    
    president_id = presidents.data[0]["id"]
    
    # 2. Create notification for the President
    from app.routers.notifications import create_notification
    create_notification(
        user_id=president_id,
        title="Account Deletion Request",
        message=f"{current_user['full_name']} has requested to delete their account.",
        type="deletion_request",
        related_id=current_user["id"]
    )
    
    return {"status": "success", "message": "Deletion request sent to President"}


@router.post("/transfer-ownership")
async def transfer_ownership(
    target_user_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "president":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only president can transfer ownership")
    
    sb = get_supabase_admin()
    # Check target user
    target = sb.table("users").select("*").eq("id", target_user_id).single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    if not target.data["is_approved"]:
        raise HTTPException(status_code=400, detail="Target user must be approved")

    # Demote current president, Promote target
    sb.table("users").update({"role": "vp"}).eq("id", current_user["id"]).execute()
    sb.table("users").update({"role": "president"}).eq("id", target_user_id).execute()
    
    return {"status": "success"}


@router.delete("/nuke")
async def nuke_organization(
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "president":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only president can delete the organization")
    
    sb = get_supabase_admin()
    
    # 1. Delete all domains (cascades to projects, tasks, submissions, messages)
    sb.table("domains").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    # 2. Delete all users from public.users
    # This won't delete auth.users automatically unless we use admin API, 
    # but it will break their profiles and prevent login if we have profile checks.
    sb.table("users").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    return {"status": "success"}
