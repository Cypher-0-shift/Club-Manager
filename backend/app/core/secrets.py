"""
Secrets Manager - Fetch secrets from AWS Secrets Manager or Supabase Vault
"""
import os
import json
from typing import Optional, Dict, Any
from loguru import logger


class SecretsManager:
    """
    Secrets Manager for fetching sensitive configuration at runtime.
    
    PHASE 3: Supports multiple backends:
    - Environment variables (development)
    - AWS Secrets Manager (production)
    - Supabase Vault (production)
    - File-based secrets (Kubernetes secrets)
    
    Priority order:
    1. Environment variables (if USE_ENV_SECRETS=true)
    2. AWS Secrets Manager (if AWS_SECRETS_ENABLED=true)
    3. Supabase Vault (if SUPABASE_VAULT_ENABLED=true)
    4. File-based secrets (if SECRETS_FILE_PATH is set)
    """
    
    _cache: Dict[str, Any] = {}
    _initialized = False
    
    @classmethod
    def _initialize(cls):
        """Initialize secrets manager on first use."""
        if cls._initialized:
            return
        
        cls._initialized = True
        
        # Determine which backend to use
        use_env = os.getenv("USE_ENV_SECRETS", "true").lower() == "true"
        aws_enabled = os.getenv("AWS_SECRETS_ENABLED", "false").lower() == "true"
        vault_enabled = os.getenv("SUPABASE_VAULT_ENABLED", "false").lower() == "true"
        
        if use_env:
            logger.info("🔑 Using environment variables for secrets (development mode)")
        elif aws_enabled:
            logger.info("🔑 Using AWS Secrets Manager for secrets")
        elif vault_enabled:
            logger.info("🔑 Using Supabase Vault for secrets")
        else:
            logger.warning("⚠️  No secrets backend configured. Using environment variables.")
    
    @classmethod
    def get_secret(cls, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get a secret value.
        
        Args:
            key: Secret key (e.g., "JWT_SECRET", "ENCRYPTION_KEY")
            default: Default value if secret not found
            
        Returns:
            Secret value or default
        """
        cls._initialize()
        
        # Check cache first
        if key in cls._cache:
            return cls._cache[key]
        
        # Try different backends in priority order
        value = None
        
        # 1. Environment variables
        if os.getenv("USE_ENV_SECRETS", "true").lower() == "true":
            value = os.getenv(key)
            if value:
                cls._cache[key] = value
                return value
        
        # 2. AWS Secrets Manager
        if os.getenv("AWS_SECRETS_ENABLED", "false").lower() == "true":
            value = cls._get_from_aws(key)
            if value:
                cls._cache[key] = value
                return value
        
        # 3. Supabase Vault
        if os.getenv("SUPABASE_VAULT_ENABLED", "false").lower() == "true":
            value = cls._get_from_supabase_vault(key)
            if value:
                cls._cache[key] = value
                return value
        
        # 4. File-based secrets (Kubernetes)
        secrets_file = os.getenv("SECRETS_FILE_PATH")
        if secrets_file:
            value = cls._get_from_file(key, secrets_file)
            if value:
                cls._cache[key] = value
                return value
        
        # Return default if nothing found
        if default is not None:
            return default
        
        logger.warning(f"Secret '{key}' not found in any backend")
        return None
    
    @classmethod
    def _get_from_aws(cls, key: str) -> Optional[str]:
        """
        Fetch secret from AWS Secrets Manager.
        
        Requires: boto3 library and AWS credentials configured
        """
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            secret_name = os.getenv("AWS_SECRET_NAME", "club-task-manager/secrets")
            region = os.getenv("AWS_REGION", "us-east-1")
            
            client = boto3.client("secretsmanager", region_name=region)
            
            try:
                response = client.get_secret_value(SecretId=secret_name)
                secrets = json.loads(response["SecretString"])
                return secrets.get(key)
            except ClientError as e:
                logger.error(f"Failed to fetch secret from AWS: {e}")
                return None
        
        except ImportError:
            logger.warning("boto3 not installed. Cannot use AWS Secrets Manager.")
            return None
    
    @classmethod
    def _get_from_supabase_vault(cls, key: str) -> Optional[str]:
        """
        Fetch secret from Supabase Vault.
        
        Uses Supabase's vault.secrets table via RPC call.
        """
        try:
            from app.core.supabase import get_supabase_admin
            
            sb = get_supabase_admin()
            
            # Call Supabase Vault RPC function
            # Note: This requires setting up vault in Supabase
            result = sb.rpc("vault_get_secret", {"secret_name": key}).execute()
            
            if result.data:
                return result.data
            
            return None
        
        except Exception as e:
            logger.error(f"Failed to fetch secret from Supabase Vault: {e}")
            return None
    
    @classmethod
    def _get_from_file(cls, key: str, file_path: str) -> Optional[str]:
        """
        Fetch secret from JSON file.
        
        Useful for Kubernetes secrets mounted as files.
        """
        try:
            with open(file_path, 'r') as f:
                secrets = json.load(f)
                return secrets.get(key)
        except Exception as e:
            logger.error(f"Failed to read secrets file: {e}")
            return None
    
    @classmethod
    def clear_cache(cls):
        """Clear the secrets cache. Useful for testing."""
        cls._cache.clear()


# Convenience functions
def get_jwt_secret() -> str:
    """
    Get JWT secret from secrets manager.
    
    PHASE 3: Fetches from secrets manager instead of direct env var.
    Falls back to JWT_SECRET env var if secrets manager not configured.
    """
    secret = SecretsManager.get_secret("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET not found in secrets manager or environment")
    return secret


def get_encryption_key() -> Optional[str]:
    """Get encryption key from secrets manager."""
    return SecretsManager.get_secret("ENCRYPTION_KEY")


def get_database_password() -> Optional[str]:
    """Get database password from secrets manager."""
    return SecretsManager.get_secret("DATABASE_PASSWORD")
