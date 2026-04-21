from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from typing import Optional

router = APIRouter(prefix="/projects", tags=["projects"])
EXEC_ROLES = ("president", "vp", "secretary")
LEAD_AND_ABOVE = ("president", "vp", "secretary", "lead")


@router.get("/", response_model=list[ProjectOut])
async def list_projects(
    domain_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    query = sb.table("projects").select("*")

    if domain_id:
        query = query.eq("domain_id", domain_id)
    elif current_user["role"] not in EXEC_ROLES:
        # Non-execs only see their domain's projects
        query = query.eq("domain_id", current_user.get("domain_id"))

    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in LEAD_AND_ABOVE:
        raise HTTPException(status_code=403, detail="Only leads and above can create projects")

    # Leads can only create in their own domain
    if current_user["role"] == "lead" and body.domain_id != current_user.get("domain_id"):
        raise HTTPException(status_code=403, detail="Cannot create project in another domain")

    sb = get_supabase_admin()
    payload = body.model_dump()
    payload["created_by"] = current_user["id"]
    result = sb.table("projects").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")
    return result.data[0]


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("projects").select("*").eq("id", project_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    sb = get_supabase_admin()
    proj = sb.table("projects").select("*").eq("id", project_id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user["role"] not in EXEC_ROLES:
        if current_user["role"] != "lead" or proj.data["domain_id"] != current_user.get("domain_id"):
            raise HTTPException(status_code=403, detail="Not permitted")

    result = sb.table("projects").update(body.model_dump(exclude_none=True)).eq("id", project_id).execute()
    return result.data[0]


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in EXEC_ROLES:
        raise HTTPException(status_code=403, detail="Only executives can delete projects")
    sb = get_supabase_admin()
    sb.table("projects").delete().eq("id", project_id).execute()
