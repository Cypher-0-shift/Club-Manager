from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import UserUpdate, UserOut
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

EXEC_ROLES = ("president", "vp", "secretary")


@router.get("/", response_model=list[UserOut])
async def list_users(
    is_approved: Optional[bool] = None,
    domain_id: Optional[str] = None,
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

    result = query.order("created_at", desc=True).execute()
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
    # Only execs can update others; self can update own profile fields
    if user_id != current_user["id"] and current_user["role"] not in EXEC_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

    sb = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)

    # Non-execs cannot change role or approval status
    if current_user["role"] not in EXEC_ROLES:
        updates.pop("role", None)
        updates.pop("is_approved", None)

    result = sb.table("users").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return result.data[0]
