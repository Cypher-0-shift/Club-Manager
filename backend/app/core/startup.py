"""
Startup initialization - Auto-seed data on first run
"""
import json
import os
from loguru import logger
from app.core.supabase import get_supabase_admin


def initialize_permissions():
    """
    Initialize permissions.json if it doesn't exist.
    This runs automatically on startup.
    """
    file_path = "permissions.json"
    
    if os.path.exists(file_path):
        logger.info("✅ Permissions file already exists")
        return
    
    logger.info("🔧 Creating default permissions.json...")
    
    default_permissions = [
        {
            "role": "president",
            "permissions": {
                "users": {"read": True, "create": True, "update": True, "delete": True, "approve": True},
                "domains": {"read": True, "create": True, "update": True, "delete": True},
                "projects": {"read": True, "create": True, "update": True, "delete": True},
                "tasks": {"read": True, "create": True, "update": True, "delete": True, "assign": True},
                "submissions": {"read": True, "create": True, "update": True, "delete": True},
                "messages": {"read": True, "create": True, "update": True, "delete": True},
                "analytics": {"read": True},
                "settings": {"read": True, "update": True}
            }
        },
        {
            "role": "vp",
            "permissions": {
                "users": {"read": True, "create": True, "update": True, "delete": False, "approve": True},
                "domains": {"read": True, "create": True, "update": True, "delete": False},
                "projects": {"read": True, "create": True, "update": True, "delete": True},
                "tasks": {"read": True, "create": True, "update": True, "delete": True, "assign": True},
                "submissions": {"read": True, "create": True, "update": True, "delete": False},
                "messages": {"read": True, "create": True, "update": True, "delete": False},
                "analytics": {"read": True},
                "settings": {"read": True, "update": False}
            }
        },
        {
            "role": "secretary",
            "permissions": {
                "users": {"read": True, "create": True, "update": True, "delete": False, "approve": True},
                "domains": {"read": True, "create": True, "update": True, "delete": False},
                "projects": {"read": True, "create": True, "update": True, "delete": True},
                "tasks": {"read": True, "create": True, "update": True, "delete": True, "assign": True},
                "submissions": {"read": True, "create": True, "update": True, "delete": False},
                "messages": {"read": True, "create": True, "update": True, "delete": False},
                "analytics": {"read": True},
                "settings": {"read": True, "update": False}
            }
        },
        {
            "role": "lead",
            "permissions": {
                "users": {"read": True, "create": False, "update": True, "delete": False, "approve": False},
                "domains": {"read": True, "create": False, "update": False, "delete": False},
                "projects": {"read": True, "create": True, "update": True, "delete": True},
                "tasks": {"read": True, "create": True, "update": True, "delete": True, "assign": True},
                "submissions": {"read": True, "create": True, "update": False, "delete": False},
                "messages": {"read": True, "create": True, "update": False, "delete": False},
                "analytics": {"read": True},
                "settings": {"read": True, "update": False}
            }
        },
        {
            "role": "member",
            "permissions": {
                "users": {"read": True, "create": False, "update": False, "delete": False, "approve": False},
                "domains": {"read": True, "create": False, "update": False, "delete": False},
                "projects": {"read": True, "create": False, "update": False, "delete": False},
                "tasks": {"read": True, "create": False, "update": True, "delete": False, "assign": False},
                "submissions": {"read": True, "create": True, "update": False, "delete": False},
                "messages": {"read": True, "create": True, "update": False, "delete": False},
                "analytics": {"read": True},
                "settings": {"read": True, "update": False}
            }
        }
    ]
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(default_permissions, f, indent=2, ensure_ascii=False)
    
    logger.info("✅ Created default permissions.json")


def check_database_connection():
    """
    Check if database connection is working.
    """
    try:
        sb = get_supabase_admin()
        # Simple query to test connection
        result = sb.table("organizations").select("id").limit(1).execute()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def run_startup_tasks():
    """
    Run all startup initialization tasks.
    Called automatically when the app starts.
    """
    logger.info("🚀 Running startup initialization...")
    
    # Initialize permissions
    initialize_permissions()
    
    # Check database connection
    check_database_connection()
    
    logger.info("✅ Startup initialization complete")
