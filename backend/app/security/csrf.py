"""
CSRF Protection - Prevent Cross-Site Request Forgery attacks
"""
from fastapi import HTTPException, status, Request
from typing import Optional
import secrets
import hmac
import hashlib
import time
from app.core.config import settings


# CSRF token expiry (1 hour)
CSRF_TOKEN_EXPIRY = 3600


def generate_csrf_token(user_id: str) -> str:
    """
    Generate a CSRF token for a user.
    
    PHASE 3: Creates a signed token that includes user ID and timestamp.
    
    Args:
        user_id: User ID to bind the token to
        
    Returns:
        CSRF token string
        
    Format: timestamp:random:signature
    """
    timestamp = str(int(time.time()))
    random_part = secrets.token_urlsafe(16)
    
    # Create signature: HMAC(JWT_SECRET, user_id:timestamp:random)
    message = f"{user_id}:{timestamp}:{random_part}"
    signature = hmac.new(
        settings.JWT_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return f"{timestamp}:{random_part}:{signature}"


def verify_csrf_token(token: str, user_id: str) -> bool:
    """
    Verify a CSRF token.
    
    Args:
        token: CSRF token to verify
        user_id: User ID to verify against
        
    Returns:
        True if valid, False otherwise
    """
    if not token:
        return False
    
    try:
        parts = token.split(':')
        if len(parts) != 3:
            return False
        
        timestamp_str, random_part, provided_signature = parts
        timestamp = int(timestamp_str)
        
        # Check if token is expired
        current_time = int(time.time())
        if current_time - timestamp > CSRF_TOKEN_EXPIRY:
            return False
        
        # Verify signature
        message = f"{user_id}:{timestamp_str}:{random_part}"
        expected_signature = hmac.new(
            settings.JWT_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(provided_signature, expected_signature)
    
    except Exception:
        return False


def get_csrf_token(user_id: str) -> str:
    """
    Get a CSRF token for a user.
    
    This is a convenience wrapper around generate_csrf_token.
    """
    return generate_csrf_token(user_id)


async def validate_csrf_token(request: Request, user_id: str):
    """
    Dependency to validate CSRF token from request.
    
    PHASE 3: Checks for CSRF token in X-CSRF-Token header.
    
    Args:
        request: FastAPI request object
        user_id: User ID to validate against
        
    Raises:
        HTTPException: 403 if CSRF token is missing or invalid
        
    Example:
        @router.post("/tasks")
        async def create_task(
            request: Request,
            current_user: dict = Depends(get_current_user)
        ):
            await validate_csrf_token(request, current_user["id"])
            # ... rest of endpoint
    """
    # Get CSRF token from header
    csrf_token = request.headers.get("X-CSRF-Token")
    
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing. Include X-CSRF-Token header."
        )
    
    if not verify_csrf_token(csrf_token, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired CSRF token"
        )


def csrf_exempt(func):
    """
    Decorator to mark an endpoint as CSRF-exempt.
    
    Use sparingly - only for endpoints that don't modify state
    or have alternative protection mechanisms.
    """
    func._csrf_exempt = True
    return func
