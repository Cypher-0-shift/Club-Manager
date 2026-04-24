from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.supabase import get_supabase_admin, get_supabase_anon
from functools import wraps
from typing import Callable

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Decode JWT and verify against the DB.
    
    PHASE 3: Sets the user's JWT on the anon client for RLS enforcement.
    """
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = credentials.credentials
    
    # Use admin client to verify token and fetch user
    sb_admin = get_supabase_admin()
    
    try:
        user_res = sb_admin.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = user_res.user.id
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = sb_admin.table("users").select("*").eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = result.data
    if not user.get("is_approved"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")

    # PHASE 3: Set the JWT on anon client for RLS enforcement
    # This allows subsequent queries using anon client to respect RLS policies
    sb_anon = get_supabase_anon()
    try:
        # Set the auth token on the anon client
        sb_anon.auth.set_session(token, user_res.user.refresh_token if hasattr(user_res.user, 'refresh_token') else None)
    except:
        # If setting session fails, continue (client will use anon key)
        pass

    return user


def require_role(*roles: str):
    """Dependency factory that enforces role membership."""
    async def checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user['role']}' not permitted for this action"
            )
        return current_user
    return checker
