from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import uuid

from app.core.config import settings
from app.core.logging import setup_logging
from app.routers import users, domains, projects, tasks

setup_logging()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Club Task Manager API",
    version="1.0.0",
    docs_url="/v1/docs",
    redoc_url="/v1/redoc",
    openapi_url="/v1/openapi.json",
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
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

# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    return {"message": "Club Task Manager API", "docs": "/v1/docs"}
