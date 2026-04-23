from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.supabase import get_supabase_admin
from functools import wraps
from typing import Callable

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Decode JWT and verify against the DB."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = credentials.credentials
    sb = get_supabase_admin()
    
    try:
        user_res = sb.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = user_res.user.id
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = sb.table("users").select("*").eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = result.data
    if not user.get("is_approved"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")

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
