from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
from contextlib import asynccontextmanager
import uuid

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.supabase import close_http_client, close_supabase_clients
from app.core.startup import run_startup_tasks
from app.services.cache_service import CacheService
from app.routers import users, domains, projects, tasks, notifications, batch, onboarding

setup_logging()

# ═══════════════════════════════════════════════════════════
# PHASE 2: Lifespan context manager for startup/shutdown
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI app.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting Club Task Manager API...")
    logger.info(f"Environment: {settings.API_VERSION}")
    
    # Run startup initialization (auto-seed permissions, etc.)
    run_startup_tasks()
    
    # Test Redis connection (optional)
    try:
        cache_client = await CacheService.get_client()
        if cache_client:
            logger.info("✅ Redis cache connected")
        else:
            logger.warning("⚠️  Redis cache disabled (connection failed)")
    except Exception as e:
        logger.warning(f"⚠️  Redis cache disabled: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Club Task Manager API...")
    await close_http_client()
    await close_supabase_clients()
    await CacheService.close_client()
    logger.info("✅ Cleanup complete")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Club Task Manager API",
    version="1.0.0",
    docs_url="/v1/docs",
    redoc_url="/v1/redoc",
    openapi_url="/v1/openapi.json",
    lifespan=lifespan
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ═══════════════════════════════════════════════════════════
# PHASE 2: GZip compression middleware (6x reduction)
# ═══════════════════════════════════════════════════════════
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=6)

# ═══════════════════════════════════════════════════════════
# PHASE 3: CORS with environment-based origins
# ═══════════════════════════════════════════════════════════
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,  # Read from ALLOWED_ORIGINS env var
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Request logging middleware
# ─────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    trace_id = str(uuid.uuid4())[:8]
    logger.info(f"[{trace_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"[{trace_id}] → {response.status_code}")
    return response

# ─────────────────────────────────────────────
# Global exception handler — returns standard envelope
# ─────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc.errors()),
                "status": 422,
                "trace_id": str(uuid.uuid4()),
            }
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())
    logger.error(f"Unhandled error [{trace_id}]: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "status": 500,
                "trace_id": trace_id,
            }
        },
    )

# ─────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────
prefix = "/v1"
app.include_router(users.router,   prefix=prefix)
app.include_router(domains.router, prefix=prefix)
app.include_router(projects.router, prefix=prefix)
app.include_router(tasks.router,   prefix=prefix)
app.include_router(notifications.router, prefix=prefix)
app.include_router(batch.router, prefix=prefix)
app.include_router(onboarding.router, prefix=prefix)

# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    return {"message": "Club Task Manager API", "docs": "/v1/docs"}
