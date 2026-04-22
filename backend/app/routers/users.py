from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import UserUpdate, UserOut, UserCreate
from typing import Optional

router = APIRouter(prefix="/users", tags=["users"])

EXEC_ROLES = ("president", "vp", "secretary")


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate):
    sb = get_supabase_admin()
    user_data = body.model_dump(exclude={"is_approved"}, exclude_none=True)
    
    count_res = sb.table("users").select("id", count="exact").execute()
    is_first_user = (count_res.count or 0) == 0

    if is_first_user:
        user_data["is_approved"] = True
        user_data["role"] = "president"
    else:
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
    # Only execs can update others; self can update own profile fields
    if user_id != current_user["id"] and current_user["role"] not in EXEC_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

    sb = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)

    # Non-execs cannot change role or approval status or domain
    if current_user["role"] not in EXEC_ROLES:
        updates.pop("role", None)
        updates.pop("is_approved", None)
        updates.pop("domain_id", None)

    result = sb.table("users").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return result.data[0]
