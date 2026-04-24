from pydantic_settings import BaseSettings, SettingsConfigDict
import re
import os

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    API_VERSION: str = "v1"
    
    # Redis settings (optional - caching disabled if not provided)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    
    # Security settings (PHASE 3)
    ENABLE_ENCRYPTION: bool = False
    
    # Secrets manager settings
    USE_ENV_SECRETS: bool = True
    AWS_SECRETS_ENABLED: bool = False
    SUPABASE_VAULT_ENABLED: bool = False
    AWS_SECRET_NAME: str = "club-task-manager/secrets"
    AWS_REGION: str = "us-east-1"
    
    # JWT_SECRET is now fetched from secrets manager
    # Kept here for backward compatibility with direct env var
    _jwt_secret: str = ""

    @property
    def JWT_SECRET(self) -> str:
        """
        Get JWT secret from secrets manager.
        
        PHASE 3: Fetches from secrets manager at runtime instead of
        loading from environment at startup.
        
        Priority:
        1. Secrets manager (AWS/Supabase Vault)
        2. Environment variable (development)
        """
        if self._jwt_secret:
            return self._jwt_secret
        
        # Import here to avoid circular dependency
        from app.core.secrets import get_jwt_secret
        
        try:
            self._jwt_secret = get_jwt_secret()
            return self._jwt_secret
        except ValueError:
            # Fallback to environment variable
            jwt_secret = os.getenv("JWT_SECRET")
            if not jwt_secret:
                raise ValueError(
                    "JWT_SECRET not found. Set JWT_SECRET environment variable "
                    "or configure secrets manager (AWS_SECRETS_ENABLED or SUPABASE_VAULT_ENABLED)"
                )
            self._jwt_secret = jwt_secret
            return self._jwt_secret
    
    @property
    def ENCRYPTION_KEY(self) -> str:
        """Get encryption key from secrets manager."""
        from app.core.secrets import get_encryption_key
        return get_encryption_key() or os.getenv("ENCRYPTION_KEY", "")

    @property
    def origins_list(self) -> list[str]:
        """
        Parse ALLOWED_ORIGINS and support wildcards.
        
        PHASE 3: Supports patterns like:
        - http://localhost:3000
        - https://*.vercel.app
        - https://app.example.com
        """
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(',')]
        
        # Convert wildcard patterns to regex
        processed_origins = []
        for origin in origins:
            if '*' in origin:
                # Convert wildcard to regex pattern
                # e.g., https://*.vercel.app -> https://.*\.vercel\.app
                pattern = origin.replace('.', r'\.').replace('*', '.*')
                processed_origins.append(re.compile(f"^{pattern}$"))
            else:
                processed_origins.append(origin)
        
        return processed_origins

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
