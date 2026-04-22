from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import DomainCreate, DomainUpdate, DomainOut

router = APIRouter(prefix="/domains", tags=["domains"])
EXEC_ROLES = ("president", "vp", "secretary")


@router.get("/public", response_model=list[DomainOut])
async def list_public_domains():
    sb = get_supabase_admin()
    result = sb.table("domains").select("*").order("name").execute()
    return result.data or []


@router.get("/", response_model=list[DomainOut])
async def list_domains(current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("domains").select("*").order("name").execute()
    return result.data or []


@router.post("/", response_model=DomainOut, status_code=status.HTTP_201_CREATED)
async def create_domain(
    body: DomainCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in EXEC_ROLES:
        raise HTTPException(status_code=403, detail="Only executives can create domains")
    sb = get_supabase_admin()
    result = sb.table("domains").insert(body.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create domain")
    return result.data[0]


@router.get("/{domain_id}", response_model=DomainOut)
async def get_domain(domain_id: str, current_user: dict = Depends(get_current_user)):
    sb = get_supabase_admin()
    result = sb.table("domains").select("*").eq("id", domain_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Domain not found")
    return result.data


@router.patch("/{domain_id}", response_model=DomainOut)
async def update_domain(
    domain_id: str,
    body: DomainUpdate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in EXEC_ROLES:
        raise HTTPException(status_code=403, detail="Only executives can update domains")
    sb = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)
    result = sb.table("domains").update(updates).eq("id", domain_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Domain not found")
    return result.data[0]


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_domain(
    domain_id: str,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "president":
        raise HTTPException(status_code=403, detail="Only president can delete domains")
    sb = get_supabase_admin()
    sb.table("domains").delete().eq("id", domain_id).execute()
