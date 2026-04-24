"""
Batch API Router - Execute multiple API requests in a single call
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.dependencies.auth import get_current_user
from app.core.supabase import get_supabase_admin
from app.services.cache_service import CacheService
from app.services.task_service import TaskService
import asyncio

router = APIRouter(prefix="/batch", tags=["batch"])


class BatchRequest(BaseModel):
    """Single sub-request in a batch."""
    id: str = Field(..., description="Unique identifier for this sub-request")
    endpoint: str = Field(..., description="Endpoint path (e.g., 'domains', 'tasks')")
    params: Optional[Dict[str, Any]] = Field(default=None, description="Query parameters")


class BatchRequestBody(BaseModel):
    """Batch request containing multiple sub-requests."""
    requests: List[BatchRequest] = Field(..., max_length=10, description="List of sub-requests (max 10)")


class BatchResponse(BaseModel):
    """Response for a single sub-request."""
    id: str
    status: int
    data: Optional[Any] = None
    error: Optional[str] = None


@router.post("", response_model=List[BatchResponse])
async def execute_batch(
    body: BatchRequestBody,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute multiple API requests in a single call.
    
    PHASE 2: Reduces network overhead by batching common initial page load requests.
    
    Supported endpoints:
    - domains: List all domains
    - tasks: List tasks (with optional filters)
    - projects: List projects (with optional filters)
    - users: List users (with optional filters)
    - permissions: Get permissions matrix
    - me: Get current user profile
    
    Example request:
    ```json
    {
      "requests": [
        {"id": "1", "endpoint": "domains"},
        {"id": "2", "endpoint": "tasks", "params": {"limit": 50}},
        {"id": "3", "endpoint": "permissions"}
      ]
    }
    ```
    
    Returns:
    ```json
    [
      {"id": "1", "status": 200, "data": [...]},
      {"id": "2", "status": 200, "data": [...]},
      {"id": "3", "status": 200, "data": [...]}
    ]
    ```
    """
    sb = get_supabase_admin()
    
    async def execute_single_request(req: BatchRequest) -> BatchResponse:
        """Execute a single sub-request."""
        try:
            endpoint = req.endpoint.lower().strip("/")
            params = req.params or {}
            
            # ═══════════════════════════════════════════════════════════
            # Domains endpoint
            # ═══════════════════════════════════════════════════════════
            if endpoint == "domains":
                # Try cache first
                cached = await CacheService.get_domains()
                if cached:
                    return BatchResponse(id=req.id, status=200, data=cached)
                
                result = sb.table("domains").select("*").order("name").execute()
                data = result.data or []
                
                # Cache for 5 minutes
                await CacheService.set_domains(data, ttl=300)
                
                return BatchResponse(id=req.id, status=200, data=data)
            
            # ═══════════════════════════════════════════════════════════
            # Tasks endpoint (PHASE 4: Use enriched view)
            # ═══════════════════════════════════════════════════════════
            elif endpoint == "tasks":
                # PHASE 4: Query from v_enriched_tasks view for single-query performance
                query = sb.table("v_enriched_tasks").select("*")
                
                # Apply RBAC isolation FIRST
                if current_user["role"] == "member":
                    query = query.eq("assignee_id", current_user["id"])
                elif current_user["role"] == "lead":
                    user_domain = current_user.get("domain_id")
                    if user_domain:
                        query = query.eq("domain_id", user_domain)
                
                # Apply filters
                if params.get("domain_id"):
                    query = query.eq("domain_id", params["domain_id"])
                if params.get("project_id"):
                    query = query.eq("project_id", params["project_id"])
                if params.get("status"):
                    query = query.eq("status", params["status"])
                
                # Pagination
                limit = min(params.get("limit", 50), 500)
                offset = params.get("offset", 0)
                
                result = query.order("is_pinned", desc=True).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                tasks = result.data or []
                
                # Process tasks from enriched view (no enrichment needed!)
                processed = TaskService.enrich_tasks_from_view(tasks)
                
                return BatchResponse(id=req.id, status=200, data=processed)
            
            # ═══════════════════════════════════════════════════════════
            # Projects endpoint
            # ═══════════════════════════════════════════════════════════
            elif endpoint == "projects":
                query = sb.table("projects").select("*")
                
                # Apply RBAC
                if current_user["role"] not in ("president", "vp", "secretary"):
                    user_domain = current_user.get("domain_id")
                    if user_domain:
                        query = query.eq("domain_id", user_domain)
                
                # Apply filters
                if params.get("domain_id"):
                    query = query.eq("domain_id", params["domain_id"])
                
                limit = min(params.get("limit", 50), 500)
                offset = params.get("offset", 0)
                
                result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                
                return BatchResponse(id=req.id, status=200, data=result.data or [])
            
            # ═══════════════════════════════════════════════════════════
            # Users endpoint
            # ═══════════════════════════════════════════════════════════
            elif endpoint == "users":
                query = sb.table("users").select("*")
                
                # Apply RBAC
                if current_user["role"] not in ("president", "vp", "secretary"):
                    if current_user["role"] == "lead":
                        query = query.eq("domain_id", current_user.get("domain_id"))
                    else:
                        query = query.eq("id", current_user["id"])
                
                # Apply filters
                if params.get("domain_id"):
                    query = query.eq("domain_id", params["domain_id"])
                if params.get("is_approved") is not None:
                    query = query.eq("is_approved", params["is_approved"])
                
                limit = min(params.get("limit", 50), 500)
                offset = params.get("offset", 0)
                
                result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                
                return BatchResponse(id=req.id, status=200, data=result.data or [])
            
            # ═══════════════════════════════════════════════════════════
            # Permissions endpoint
            # ═══════════════════════════════════════════════════════════
            elif endpoint == "permissions":
                # Try cache first
                cached = await CacheService.get_permissions()
                if cached:
                    return BatchResponse(id=req.id, status=200, data=cached)
                
                import json
                import os
                file_path = "permissions.json"
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    
                    # Cache for 5 minutes
                    await CacheService.set_permissions(data, ttl=300)
                    
                    return BatchResponse(id=req.id, status=200, data=data)
                else:
                    return BatchResponse(id=req.id, status=404, error="Permissions file not found")
            
            # ═══════════════════════════════════════════════════════════
            # Me endpoint
            # ═══════════════════════════════════════════════════════════
            elif endpoint == "me":
                return BatchResponse(id=req.id, status=200, data=current_user)
            
            else:
                return BatchResponse(
                    id=req.id,
                    status=400,
                    error=f"Unsupported endpoint: {endpoint}"
                )
        
        except Exception as e:
            return BatchResponse(
                id=req.id,
                status=500,
                error=str(e)
            )
    
    # ═══════════════════════════════════════════════════════════
    # PHASE 2: Execute all sub-requests concurrently
    # ═══════════════════════════════════════════════════════════
    responses = await asyncio.gather(
        *[execute_single_request(req) for req in body.requests],
        return_exceptions=True
    )
    
    # Handle any exceptions
    final_responses = []
    for i, resp in enumerate(responses):
        if isinstance(resp, Exception):
            final_responses.append(BatchResponse(
                id=body.requests[i].id,
                status=500,
                error=str(resp)
            ))
        else:
            final_responses.append(resp)
    
    return final_responses
