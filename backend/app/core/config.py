from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET: str
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    API_VERSION: str = "v1"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(',')]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
