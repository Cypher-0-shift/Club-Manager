from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import (
    TaskCreate, TaskUpdate, TaskStatusUpdate, TaskOut,
    SubmissionCreate, SubmissionOut, MessageCreate, MessageOut,
)
from typing import Optional
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])

EXEC_ROLES     = ("president", "vp", "secretary")
LEAD_AND_ABOVE = ("president", "vp", "secretary", "lead")
ALLOWED_MIME   = {
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _enrich(tasks: list[dict], sb) -> list[dict]:
    """Attach project, assignee and creator objects + counts."""
    if not tasks:
        return []
    task_ids = [t["id"] for t in tasks]

    # Message counts
    msg_counts: dict[str, int] = {}
    msgs = sb.table("messages").select("task_id").in_("task_id", task_ids).execute()
    for m in (msgs.data or []):
        msg_counts[m["task_id"]] = msg_counts.get(m["task_id"], 0) + 1

    # Submission counts
    sub_counts: dict[str, int] = {}
    subs = sb.table("submissions").select("task_id").in_("task_id", task_ids).execute()
    for s in (subs.data or []):
        sub_counts[s["task_id"]] = sub_counts.get(s["task_id"], 0) + 1

    # Projects
    proj_ids = list({t["project_id"] for t in tasks})
    projs_res = sb.table("projects").select("*").in_("id", proj_ids).execute()
    proj_map = {p["id"]: p for p in (projs_res.data or [])}

    # Users
    user_ids = list({t.get("assignee_id") for t in tasks if t.get("assignee_id")} |
                    {t["created_by"] for t in tasks})
    users_res = sb.table("users").select("id,full_name,email,role").in_("id", user_ids).execute()
    user_map = {u["id"]: u for u in (users_res.data or [])}

    for t in tasks:
        t["project"]          = proj_map.get(t["project_id"])
        t["assignee"]         = user_map.get(t.get("assignee_id"))
        t["creator"]          = user_map.get(t["created_by"])
        t["message_count"]    = msg_counts.get(t["id"], 0)
        t["submission_count"] = sub_counts.get(t["id"], 0)
    return tasks


# ─────────────────────────────────────────────
# List / My tasks
# ─────────────────────────────────────────────
@router.get("/my", response_model=list[dict])
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("tasks").select("*").eq("assignee_id", current_user["id"]).order("created_at", desc=True).execute()
    return _enrich(result.data or [], sb)


@router.get("/", response_model=list[dict])
async def list_tasks(
    domain_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    query = sb.table("tasks").select("*")

    if project_id:
        query = query.eq("project_id", project_id)
    elif domain_id:
        # Filter tasks via project → domain join
        proj_res = sb.table("projects").select("id").eq("domain_id", domain_id).execute()
        proj_ids = [p["id"] for p in (proj_res.data or [])]
        if not proj_ids:
            return []
        query = query.in_("project_id", proj_ids)
    elif current_user["role"] == "member":
        query = query.eq("assignee_id", current_user["id"])
    elif current_user["role"] == "lead":
        proj_res = sb.table("projects").select("id").eq("domain_id", current_user.get("domain_id")).execute()
        proj_ids = [p["id"] for p in (proj_res.data or [])]
        if proj_ids:
            query = query.in_("project_id", proj_ids)

    if status:
        query = query.eq("status", status)

    result = query.order("is_pinned", desc=True).order("created_at", desc=True).execute()
    return _enrich(result.data or [], sb)


# ─────────────────────────────────────────────
# Create task
# ─────────────────────────────────────────────
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in LEAD_AND_ABOVE:
        raise HTTPException(status_code=403, detail="Only leads and above can create tasks")

    sb = get_supabase_admin()

    # Verify project exists and (for leads) belongs to their domain
    proj = sb.table("projects").select("*").eq("id", body.project_id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user["role"] == "lead" and proj.data["domain_id"] != current_user.get("domain_id"):
        raise HTTPException(status_code=403, detail="Project belongs to another domain")

    payload = body.model_dump()
    payload["created_by"] = current_user["id"]
    if payload.get("deadline"):
        payload["deadline"] = payload["deadline"].isoformat()

    result = sb.table("tasks").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create task")

    # Audit log
    sb.table("audit_logs").insert({
        "actor_id": current_user["id"],
        "action": "task.create",
        "entity_type": "task",
        "entity_id": result.data[0]["id"],
    }).execute()

    return _enrich([result.data[0]], sb)[0]


# ─────────────────────────────────────────────
# Get single task
# ─────────────────────────────────────────────
@router.get("/{task_id}", response_model=dict)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return _enrich([result.data], sb)[0]


# ─────────────────────────────────────────────
# Update task (metadata)
# ─────────────────────────────────────────────
@router.patch("/{task_id}", response_model=dict)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    # Permission check
    if current_user["role"] == "member" and task.data.get("assignee_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not permitted")

    updates = body.model_dump(exclude_none=True)
    if "deadline" in updates and updates["deadline"]:
        updates["deadline"] = updates["deadline"].isoformat()

    result = sb.table("tasks").update(updates).eq("id", task_id).execute()

    # Audit
    sb.table("audit_logs").insert({
        "actor_id": current_user["id"],
        "action": "task.update",
        "entity_type": "task",
        "entity_id": task_id,
        "metadata": updates,
    }).execute()

    return _enrich([result.data[0]], sb)[0]


# ─────────────────────────────────────────────
# Update task STATUS only
# ─────────────────────────────────────────────
@router.patch("/{task_id}/status", response_model=dict)
async def update_task_status(
    task_id: str,
    body: TaskStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    t = task.data

    # Overdue tasks cannot move to in_progress
    if t.get("is_overdue") and body.status == "in_progress":
        raise HTTPException(status_code=400, detail="Overdue tasks cannot be moved to in_progress")

    # Members can only update their own tasks
    if current_user["role"] == "member" and t.get("assignee_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not permitted")

    result = sb.table("tasks").update({"status": body.status}).eq("id", task_id).execute()

    sb.table("audit_logs").insert({
        "actor_id": current_user["id"],
        "action": "task.status_change",
        "entity_type": "task",
        "entity_id": task_id,
        "metadata": {"old": t["status"], "new": body.status},
    }).execute()

    return _enrich([result.data[0]], sb)[0]


# ─────────────────────────────────────────────
# Submit proof of work
# ─────────────────────────────────────────────
@router.post("/{task_id}/submit", status_code=status.HTTP_201_CREATED)
async def submit_task(
    task_id: str,
    type: str = Form(...),
    url: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    task = sb.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    payload: dict = {
        "task_id": task_id,
        "submitted_by": current_user["id"],
        "type": type,
    }

    if type == "file":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        content = await file.read()

        if file.content_type not in ALLOWED_MIME:
            raise HTTPException(status_code=400, detail="File type not allowed. Use PDF, CSV, XLSX, or DOCX.")
        if len(content) > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

        file_path = f"{task_id}/{uuid.uuid4()}_{file.filename}"
        sb.storage.from_("submissions").upload(file_path, content, {"content-type": file.content_type})
        signed = sb.storage.from_("submissions").create_signed_url(file_path, 86400)

        payload["file_url"]  = signed.get("signedURL") or file_path
        payload["file_name"] = file.filename
        payload["file_size"] = len(content)

    elif type == "url":
        if not url or not url.startswith("http"):
            raise HTTPException(status_code=400, detail="Valid URL required")
        payload["url"] = url

    elif type == "text":
        if not text_content or len(text_content.strip()) < 20:
            raise HTTPException(status_code=400, detail="Text must be at least 20 characters")
        payload["text_content"] = text_content

    result = sb.table("submissions").insert(payload).execute()

    # Mark task completed
    sb.table("tasks").update({"status": "completed"}).eq("id", task_id).execute()

    sb.table("audit_logs").insert({
        "actor_id": current_user["id"],
        "action": "task.submit",
        "entity_type": "task",
        "entity_id": task_id,
    }).execute()

    return result.data[0] if result.data else {}


@router.get("/{task_id}/submissions", response_model=list[dict])
async def list_submissions(task_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("submissions").select("*").eq("task_id", task_id).order("created_at", desc=True).execute()
    return result.data or []


# ─────────────────────────────────────────────
# Messages (per-task chat)
# ─────────────────────────────────────────────
@router.get("/{task_id}/messages", response_model=list[dict])
async def list_messages(task_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    msgs = sb.table("messages").select("*, sender:users(id,full_name,email,role)").eq("task_id", task_id).order("created_at").execute()
    return msgs.data or []


@router.post("/{task_id}/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_message(
    task_id: str,
    body: MessageCreate,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    result = sb.table("messages").insert({
        "task_id": task_id,
        "sender_id": current_user["id"],
        "content": body.content,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return result.data[0]


# ─────────────────────────────────────────────
# Delete task
# ─────────────────────────────────────────────
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in LEAD_AND_ABOVE:
        raise HTTPException(status_code=403, detail="Only leads and above can delete tasks")
    sb = get_supabase_admin()
    sb.table("tasks").delete().eq("id", task_id).execute()
