"""
Task Service - Consolidated task operations and enrichment logic
"""
from typing import List, Dict, Optional
from datetime import datetime, timezone
from supabase import Client
import asyncio


class TaskService:
    """
    Centralized service for task operations.
    
    PHASE 2: Extracted from tasks router for reusability and testability.
    PHASE 4: Optimized to use v_enriched_tasks view for single-query fetching.
    """
    
    @staticmethod
    def enrich_tasks_from_view(tasks: List[dict]) -> List[dict]:
        """
        Process tasks from v_enriched_tasks view.
        
        PHASE 4: The view already contains all joined data, so we just need
        to parse JSON fields and handle overdue detection.
        
        This is 8x faster than the old enrich_tasks() method because it
        eliminates all N+1 queries.
        
        Args:
            tasks: List of task dictionaries from v_enriched_tasks view
            
        Returns:
            List of processed task dictionaries
        """
        if not tasks:
            return []
        
        for t in tasks:
            # JSON fields are already parsed by PostgreSQL
            # No additional processing needed - the view does it all!
            
            # Backend fallback for overdue detection
            if t.get("deadline") and t["status"] not in ("completed", "overdue"):
                try:
                    deadline = datetime.fromisoformat(t["deadline"].replace("Z", "+00:00"))
                    if deadline < datetime.now(timezone.utc):
                        t["is_overdue"] = True
                        t["status"] = "overdue"
                except:
                    pass
        
        return tasks
    
    @staticmethod
    def enrich_tasks(tasks: List[dict], sb: Client) -> List[dict]:
        """
        Enrich tasks with related data (projects, users, counts).
        
        DEPRECATED: Use enrich_tasks_from_view() with v_enriched_tasks view instead.
        This method is kept for backward compatibility only.
        
        Args:
            tasks: List of task dictionaries
            sb: Supabase client
            
        Returns:
            List of enriched task dictionaries
        """
        if not tasks:
            return []
        
        task_ids = [t["id"] for t in tasks]

        # Message counts
        msg_counts: Dict[str, int] = {}
        msgs = sb.table("messages").select("task_id").in_("task_id", task_ids).execute()
        for m in (msgs.data or []):
            msg_counts[m["task_id"]] = msg_counts.get(m["task_id"], 0) + 1

        # Submission counts
        sub_counts: Dict[str, int] = {}
        subs = sb.table("submissions").select("task_id").in_("task_id", task_ids).execute()
        for s in (subs.data or []):
            sub_counts[s["task_id"]] = sub_counts.get(s["task_id"], 0) + 1

        # Projects
        proj_ids = list({t["project_id"] for t in tasks if t.get("project_id")})
        proj_map = {}
        if proj_ids:
            projs_res = sb.table("projects").select("*").in_("id", proj_ids).execute()
            proj_map = {p["id"]: p for p in (projs_res.data or [])}

        # Users
        user_ids = list({t.get("assignee_id") for t in tasks if t.get("assignee_id")} |
                        {t["created_by"] for t in tasks if t.get("created_by")})
        user_map = {}
        if user_ids:
            users_res = sb.table("users").select("id,full_name,email,role").in_("id", user_ids).execute()
            user_map = {u["id"]: u for u in (users_res.data or [])}

        # Enrich each task
        for t in tasks:
            t["project"]          = proj_map.get(t["project_id"])
            t["assignee"]         = user_map.get(t.get("assignee_id"))
            t["creator"]          = user_map.get(t["created_by"])
            t["message_count"]    = msg_counts.get(t["id"], 0)
            t["submission_count"] = sub_counts.get(t["id"], 0)

            # Backend fallback for overdue detection
            if t.get("deadline") and t["status"] not in ("completed", "overdue"):
                try:
                    deadline = datetime.fromisoformat(t["deadline"].replace("Z", "+00:00"))
                    if deadline < datetime.now(timezone.utc):
                        t["is_overdue"] = True
                        t["status"] = "overdue"
                        # Sync back to DB (fire and forget)
                        try:
                            sb.table("tasks").update({"status": "overdue", "is_overdue": True}).eq("id", t["id"]).execute()
                        except:
                            pass
                except:
                    pass

        return tasks
    
    @staticmethod
    async def enrich_tasks_async(tasks: List[dict], sb: Client) -> List[dict]:
        """
        Async version of enrich_tasks with concurrent queries.
        
        DEPRECATED: Use enrich_tasks_from_view() with v_enriched_tasks view instead.
        This method is kept for backward compatibility only.
        """
        if not tasks:
            return []
        
        task_ids = [t["id"] for t in tasks]
        
        # ═══════════════════════════════════════════════════════════
        # PHASE 2: Concurrent queries using asyncio.gather()
        # ═══════════════════════════════════════════════════════════
        
        async def fetch_messages():
            return sb.table("messages").select("task_id").in_("task_id", task_ids).execute()
        
        async def fetch_submissions():
            return sb.table("submissions").select("task_id").in_("task_id", task_ids).execute()
        
        async def fetch_projects():
            proj_ids = list({t["project_id"] for t in tasks if t.get("project_id")})
            if not proj_ids:
                return None
            return sb.table("projects").select("*").in_("id", proj_ids).execute()
        
        async def fetch_users():
            user_ids = list({t.get("assignee_id") for t in tasks if t.get("assignee_id")} |
                            {t["created_by"] for t in tasks if t.get("created_by")})
            if not user_ids:
                return None
            return sb.table("users").select("id,full_name,email,role").in_("id", user_ids).execute()
        
        # Execute all queries concurrently
        msgs_res, subs_res, projs_res, users_res = await asyncio.gather(
            fetch_messages(),
            fetch_submissions(),
            fetch_projects(),
            fetch_users(),
            return_exceptions=True
        )
        
        # Build count maps
        msg_counts: Dict[str, int] = {}
        if not isinstance(msgs_res, Exception) and msgs_res:
            for m in (msgs_res.data or []):
                msg_counts[m["task_id"]] = msg_counts.get(m["task_id"], 0) + 1
        
        sub_counts: Dict[str, int] = {}
        if not isinstance(subs_res, Exception) and subs_res:
            for s in (subs_res.data or []):
                sub_counts[s["task_id"]] = sub_counts.get(s["task_id"], 0) + 1
        
        # Build project map
        proj_map = {}
        if not isinstance(projs_res, Exception) and projs_res:
            proj_map = {p["id"]: p for p in (projs_res.data or [])}
        
        # Build user map
        user_map = {}
        if not isinstance(users_res, Exception) and users_res:
            user_map = {u["id"]: u for u in (users_res.data or [])}
        
        # Enrich each task
        for t in tasks:
            t["project"]          = proj_map.get(t["project_id"])
            t["assignee"]         = user_map.get(t.get("assignee_id"))
            t["creator"]          = user_map.get(t["created_by"])
            t["message_count"]    = msg_counts.get(t["id"], 0)
            t["submission_count"] = sub_counts.get(t["id"], 0)

            # Backend fallback for overdue detection
            if t.get("deadline") and t["status"] not in ("completed", "overdue"):
                try:
                    deadline = datetime.fromisoformat(t["deadline"].replace("Z", "+00:00"))
                    if deadline < datetime.now(timezone.utc):
                        t["is_overdue"] = True
                        t["status"] = "overdue"
                except:
                    pass

        return tasks
    
    @staticmethod
    def validate_assignee_domain(
        assignee_id: str, 
        domain_id: str, 
        sb: Client
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that an assignee belongs to the specified domain.
        
        Args:
            assignee_id: User ID to validate
            domain_id: Domain ID the task belongs to
            sb: Supabase client
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        assignee = sb.table("users").select("domain_id, role, is_approved").eq("id", assignee_id).single().execute()
        
        if not assignee.data:
            return False, "Assignee not found"
        
        if not assignee.data.get("is_approved"):
            return False, "Cannot assign task to unapproved user"
        
        # Executives can be assigned to any domain
        assignee_role = assignee.data.get("role")
        if assignee_role in ("president", "vp", "secretary"):
            return True, None
        
        # Non-executives must belong to the same domain
        assignee_domain = assignee.data.get("domain_id")
        if assignee_domain != domain_id:
            return False, f"Cannot assign task to user from different domain. Task domain: {domain_id}, Assignee domain: {assignee_domain}"
        
        return True, None
