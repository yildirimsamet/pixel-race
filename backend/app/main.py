
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, horses, notifications, races, users, goodluck, rewards, admin, feedback, token_info, chat
from app.core.exceptions import PixelRaceException, to_http_exception
from app.core.logging_config import get_logger, setup_logging
from app.db.base import close_db, init_db, get_db
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.bot_service import bot_service
from app.services.logging_service import logging_service
from app.middleware.logging_middleware import LoggingMiddleware

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting Pixel Race API...")
    try:
        from app.core import game_config
        game_config.load_game_config()
        logger.info("Game configuration loaded from game-config.json")

        await init_db()
        logger.info("Database initialized")

        await logging_service.initialize()
        logger.info("Logging service initialized")

        from app.core.logging_config import add_mongodb_handler
        add_mongodb_handler()
        logger.info("MongoDB error handler configured")

        from app.core.config import settings
        if settings.BOOTSTRAP_ADMIN_WALLET:
            async for db in get_db():
                try:
                    from sqlalchemy import select, update
                    from app.models.user import User

                    result = await db.execute(
                        select(User).where(User.wallet_address == settings.BOOTSTRAP_ADMIN_WALLET)
                    )
                    bootstrap_user = result.scalar_one_or_none()

                    if bootstrap_user and not bootstrap_user.is_admin:
                        bootstrap_user.is_admin = True
                        await db.commit()
                        logger.info(
                            f"Bootstrap admin granted to wallet: {settings.BOOTSTRAP_ADMIN_WALLET}"
                        )
                    elif bootstrap_user and bootstrap_user.is_admin:
                        logger.info(
                            f"Bootstrap admin wallet already has admin privileges: {settings.BOOTSTRAP_ADMIN_WALLET}"
                        )
                    else:
                        logger.warning(
                            f"Bootstrap admin wallet not found in database: {settings.BOOTSTRAP_ADMIN_WALLET}. "
                            "User must login first before admin privileges can be granted."
                        )
                finally:
                    await db.close()
                break

        async for db in get_db():
            try:
                await bot_service.initialize_bot_accounts(db)
                logger.info("Bot accounts initialized")
            finally:
                await db.close()
            break

        async for db in get_db():
            try:
                from app.services.scheduler import auto_create_races
                await auto_create_races()
                logger.info("Initial races created")
            finally:
                await db.close()
            break

        start_scheduler()
        logger.info("Scheduler started")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

    yield

    logger.info("Shutting down Pixel Race API...")
    try:
        stop_scheduler()
        logger.info("Scheduler stopped")
        await logging_service.close()
        logger.info("Logging service closed")
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


app = FastAPI(
    title="Pixel Race API",
    version="1.0.0",
    description="NFT Horse Racing Game API with Solana Integration",
    lifespan=lifespan,
    redirect_slashes=False,
)


@app.exception_handler(PixelRaceException)
async def pixel_race_exception_handler(request: Request, exc: PixelRaceException):

    logger.warning(f"Application exception: {exc.message}")
    http_exc = to_http_exception(exc)
    return JSONResponse(
        status_code=http_exc.status_code,
        content=http_exc.detail,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):

    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Validation error", "details": exc.errors()},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):

    import traceback
    from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

    request_id = getattr(request.state, 'request_id', None)
    user_id = None
    wallet_address = None

    if hasattr(request.state, 'user'):
        user = request.state.user
        user_id = user.id
        wallet_address = user.wallet_address

    logger.error(f"Unexpected error: {exc}", exc_info=True)

    await logging_service.log_action(
        user_id=user_id,
        action=LogAction.LOGIN,
        step=LogStep.ERROR,
        level=LogLevel.ERROR,
        message=f"SYSTEM_ERROR: {str(exc)}",
        metadata={
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "endpoint": str(request.url.path),
            "method": request.method,
            "traceback": traceback.format_exc(),
        },
        request_id=request_id,
        wallet_address=wallet_address,
    )

    await logging_service.log_error(
        error_type=type(exc).__name__,
        error_message=str(exc),
        stack_trace=traceback.format_exc(),
        severity="CRITICAL",
        user_id=user_id,
        wallet_address=wallet_address,
        request_id=request_id,
        endpoint=str(request.url.path),
        method=request.method,
        additional_context={
            "query_params": dict(request.query_params),
        },
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal server error"},
    )


from app.core.config import settings
import os

cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins != "*":
    cors_origins = [origin.strip() for origin in cors_origins.split(",")]
else:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(horses.router)
app.include_router(races.router)
app.include_router(notifications.router)
app.include_router(goodluck.router)
app.include_router(rewards.router)
app.include_router(feedback.router)
app.include_router(admin.router)
app.include_router(token_info.router)
app.include_router(chat.router)


@app.get("/")
async def root():

    return {"message": "Pixel Race API", "version": "1.0.0"}


@app.get("/health")
async def health_check():

    try:
        async for db in get_db():
            try:
                from sqlalchemy import text
                await db.execute(text("SELECT 1"))
                return {"status": "healthy", "database": "connected"}
            finally:
                await db.close()
            break
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)}
        )