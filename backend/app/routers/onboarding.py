from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.supabase import get_supabase_admin
import re

router = APIRouter(tags=["onboarding"])

class PresidentSignupPayload(BaseModel):
    user_id: str
    org_name: str
    full_name: str
    email: EmailStr

@router.post("/onboarding/create-president")
async def create_president(
    payload: PresidentSignupPayload,
    authorization: Optional[str] = Header(default=None),
):
    sb = get_supabase_admin()  # uses your existing get_supabase_admin() ✅

    # Optional: verify JWT matches user_id if token present
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            user_res = sb.auth.get_user(token)
            if user_res.user.id != payload.user_id:
                raise HTTPException(status_code=403, detail="Token/user_id mismatch")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    # 1. Create organization
    slug = re.sub(r'[^a-z0-9]+', '-', payload.org_name.lower()).strip('-')
    org_resp = sb.table("organizations").insert({
        "name": payload.org_name,
        "slug": slug,
    }).execute()

    if not org_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")

    org_id = org_resp.data[0]["id"]

    # 2. Create default domain
    sb.table("domains").insert({
        "org_id": org_id,
        "name": "General",
        "color_hex": "#6366f1",
    }).execute()

    # 3. Upgrade user: member → president, link org, approve
    sb.table("users").update({
        "role": "president",
        "org_id": org_id,
        "is_approved": True,
        "full_name": payload.full_name,
    }).eq("id", payload.user_id).execute()

    return {"org_id": org_id, "status": "president_upgraded"}