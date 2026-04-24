from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.schemas.schemas import DomainCreate, DomainUpdate, DomainOut
from app.services.cache_service import CacheService

router = APIRouter(prefix="/domains", tags=["domains"])
EXEC_ROLES = ("president", "vp", "secretary")


@router.get("/public", response_model=list[DomainOut])
async def list_public_domains(join_code: str = Query(..., description="Organization Join Code")):
    """
    List all domains for a specific organization (public endpoint for signup).
    """
    sb = get_supabase_admin()
    
    # Verify join_code
    org = sb.table("organizations").select("id").eq("join_code", join_code.upper()).execute()
    if not org.data:
        raise HTTPException(status_code=404, detail="Invalid Join Code")
    
    org_id = org.data[0]["id"]
    result = sb.table("domains").select("*").eq("org_id", org_id).order("name").execute()
    return result.data or []


@router.get("", response_model=list[DomainOut])
async def list_domains(current_user: dict = Depends(get_current_user)):
    """
    List all domains within the user's organization.
    """
    sb = get_supabase_admin()
    result = sb.table("domains").select("*").eq("org_id", current_user["org_id"]).order("name").execute()
    return result.data or []


@router.post("", response_model=DomainOut, status_code=status.HTTP_201_CREATED)
async def create_domain(
    body: DomainCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new domain. Only president can create.
    """
    if current_user["role"] != "president":
        raise HTTPException(status_code=403, detail="Only president can create domains")
    
    sb = get_supabase_admin()
    data = body.model_dump()
    data["org_id"] = current_user["org_id"]
    
    result = sb.table("domains").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create domain")
    
    await CacheService.invalidate_domains()
    return result.data[0]


@router.get("/{domain_id}", response_model=DomainOut)
async def get_domain(domain_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single domain by ID."""
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
    """
    Update a domain.
    Execs can update any. Leads can update ONLY their own domain.
    """
    is_exec = current_user["role"] in EXEC_ROLES
    is_my_domain = current_user.get("role") == "lead" and str(current_user.get("domain_id")) == str(domain_id)
    
    if not is_exec and not is_my_domain:
        raise HTTPException(status_code=403, detail="Not permitted to update this domain")
    
    sb = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)
    result = sb.table("domains").update(updates).eq("id", domain_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    await CacheService.invalidate_domains()
    return result.data[0]


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_domain(
    domain_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a domain.
    
    PHASE 2: Invalidates domain cache after deletion.
    """
    if current_user["role"] != "president":
        raise HTTPException(status_code=403, detail="Only president can delete domains")
    
    sb = get_supabase_admin()
    sb.table("domains").delete().eq("id", domain_id).execute()
    
    # Invalidate cache
    await CacheService.invalidate_domains()
