from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from typing import Optional
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("notifications").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).limit(20).execute()
    return result.data or []

@router.patch("/{notif_id}/read")
async def mark_as_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    sb.table("notifications").update({"is_read": True}).eq("user_id", current_user["id"]).eq("is_read", False).execute()
    return {"status": "success"}

def create_notification(user_id: str, title: str, message: str, type: str, related_id: Optional[str] = None):
    sb = get_supabase_admin()
    sb.table("notifications").insert({
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "related_id": related_id,
        "is_read": False
    }).execute()
