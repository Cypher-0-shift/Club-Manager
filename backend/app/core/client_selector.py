"""
Client Selector - Choose appropriate Supabase client based on operation type
"""
from supabase import Client
from app.core.supabase import get_supabase_admin, get_supabase_anon
from typing import Literal

OperationType = Literal["admin", "user"]


def get_supabase_client(operation_type: OperationType = "user") -> Client:
    """
    Get the appropriate Supabase client based on operation type.
    
    PHASE 3: Security best practice - use ANON client for user-facing queries
    to respect RLS policies, and SERVICE_KEY only for admin operations.
    
    Args:
        operation_type: 
            - "user": Returns ANON client (respects RLS)
            - "admin": Returns SERVICE client (bypasses RLS)
    
    Returns:
        Supabase client
        
    Usage:
        # User-facing query (respects RLS)
        sb = get_supabase_client("user")
        tasks = sb.table("tasks").select("*").execute()
        
        # Admin operation (bypasses RLS)
        sb = get_supabase_client("admin")
        all_users = sb.table("users").select("*").execute()
    """
    if operation_type == "admin":
        return get_supabase_admin()
    else:
        return get_supabase_anon()


# Convenience aliases
def get_user_client() -> Client:
    """Get ANON client for user-facing queries (respects RLS)."""
    return get_supabase_anon()


def get_admin_client() -> Client:
    """Get SERVICE client for admin operations (bypasses RLS)."""
    return get_supabase_admin()
