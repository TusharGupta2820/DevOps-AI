from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config.settings import settings
from app.database.redis import close_redis, init_redis
from app.middleware.exception_handler import register_exception_handlers
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.utils.logger import get_logger, setup_logging

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle event handler."""
    setup_logging()
    logger.info("server_starting", project_name=settings.PROJECT_NAME, environment=settings.ENVIRONMENT)
    
    # Initialize Redis connection
    await init_redis()

    # Initialize Database and Seed Data
    from app.database.session import engine, AsyncSessionLocal
    from app.models.base import Base
    from app.models.user import User, UserRole
    from app.auth.jwt import get_password_hash
    from sqlalchemy import select

    try:
        logger.info("database_initializing_tables")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_initialized")

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User))
            existing_users = result.scalars().all()
            if not existing_users:
                logger.info("seeding_database_users")
                default_users = [
                    User(
                        email="admin@enterprise.io",
                        full_name="Alex Vance (Platform Lead)",
                        role=UserRole.ADMIN,
                        hashed_password=get_password_hash("password123"),
                        is_active=True,
                        is_verified=True,
                    ),
                    User(
                        email="devops@enterprise.io",
                        full_name="Tushar Dev (Senior DevOps)",
                        role=UserRole.DEVOPS_ENGINEER,
                        hashed_password=get_password_hash("password123"),
                        is_active=True,
                        is_verified=True,
                    ),
                    User(
                        email="viewer@enterprise.io",
                        full_name="Jordan Lee (Auditor)",
                        role=UserRole.VIEWER,
                        hashed_password=get_password_hash("password123"),
                        is_active=True,
                        is_verified=True,
                    ),
                ]
                session.add_all(default_users)
                await session.commit()
                logger.info("database_users_seeded")
    except Exception as e:
        logger.error("database_initialization_failed", error=str(e))

    yield

    # Shutdown actions
    logger.info("server_shutting_down")
    await close_redis()


def create_application() -> FastAPI:
    """FastAPI application factory enforcing Clean Architecture configurations."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom Middlewares
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # Global Exception Handlers
    register_exception_handlers(app)

    # Versioned API Router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "operational",
            "docs": "/docs",
            "api_v1": settings.API_V1_STR,
        }

    return app


app = create_application()
