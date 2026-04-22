from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import UserUpdate, UserOut, UserCreate
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

EXEC_ROLES = ("president", "vp", "secretary")


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate):
    ALLOWED_SIGNUP_ROLES = {'vp', 'secretary', 'lead', 'member'}
    if body.role not in ALLOWED_SIGNUP_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role for signup")

    sb = get_supabase_admin()
    user_data = body.model_dump(exclude={"is_approved"}, exclude_none=True)
    
    user_data["is_approved"] = False
    
    result = sb.table("users").insert(user_data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user profile")
    return result.data[0]


from fastapi import APIRouter, Depends, HTTPException, status, Query

@router.get("/", response_model=list[UserOut])
async def list_users(
    is_approved: Optional[bool] = None,
    domain_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    query = sb.table("users").select("*")

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
    return current_user


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
