"""
AgroStat – FastAPI Application Entrypoint

Initialises the FastAPI app, configures CORS middleware, registers
API routes, and loads the ML model on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import (
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_ORIGINS,
)
from backend.app.routes.crop import router as crop_router
from backend.app.services.crop_recommender import recommender_service

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan – startup / shutdown logic
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On startup: initialise the crop recommender service (loads or trains
    the ML model so it is ready to serve predictions).
    On shutdown: any cleanup if needed.
    """
    logger.info("Starting up AgroStat API …")
    try:
        recommender_service.initialise()
        logger.info("ML model loaded and ready to serve predictions.")
    except Exception:
        logger.exception(
            "Failed to initialise the crop recommender service. "
            "The /predict endpoint will return 503 until the model is loaded."
        )

    yield  # application is running

    logger.info("Shutting down AgroStat API …")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(crop_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------


@app.get("/", tags=["Root"], summary="API root")
async def root():
    return {
        "name": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
        "ping": "/ping",
    }


@app.get("/ping", tags=["Monitoring"], summary="Uptime ping")
async def ping():
    return {"status": "ok", "message": "pong"}


# ---------------------------------------------------------------------------
# CLI entry-point  (python -m backend.app.main)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    from backend.app.core.config import DEBUG, HOST, PORT

    uvicorn.run(
        "backend.app.main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
    )
