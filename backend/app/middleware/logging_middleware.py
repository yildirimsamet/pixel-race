
import time
import traceback
from typing import Callable
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging_config import get_logger
from app.services.logging_service import LogLevel, logging_service

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):


    async def dispatch(self, request: Request, call_next: Callable) -> Response:

        if request.url.path in ["/health", "/healthz", "/"]:
            return await call_next(request)

        request_id = uuid4()
        request.state.request_id = request_id

        user_id = None
        wallet_address = None
        if hasattr(request.state, "user"):
            user = request.state.user
            user_id = user.id
            wallet_address = user.wallet_address

        start_time = time.time()

        try:
            response = await call_next(request)

            duration_ms = round((time.time() - start_time) * 1000, 2)

            if response.status_code >= 500:
                await logging_service.log_action(
                    user_id=user_id,
                    action="HTTP_ERROR_5XX",
                    step="ERROR",
                    level=LogLevel.ERROR,
                    message=f"{request.method} {request.url.path} - {response.status_code}",
                    metadata={
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                    },
                    request_id=request_id,
                    wallet_address=wallet_address,
                )
            elif response.status_code >= 400:
                await logging_service.log_action(
                    user_id=user_id,
                    action="HTTP_ERROR_4XX",
                    step="WARNING",
                    level=LogLevel.WARNING,
                    message=f"{request.method} {request.url.path} - {response.status_code}",
                    metadata={
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                    },
                    request_id=request_id,
                    wallet_address=wallet_address,
                )

            response.headers["X-Request-ID"] = str(request_id)

            return response

        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)

            await logging_service.log_action(
                user_id=user_id,
                action="HTTP_EXCEPTION",
                step="ERROR",
                level=LogLevel.ERROR,
                message=f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}",
                metadata={
                    "exception_type": type(exc).__name__,
                    "exception_message": str(exc),
                    "traceback": traceback.format_exc(),
                    "duration_ms": duration_ms,
                },
                request_id=request_id,
                wallet_address=wallet_address,
            )

            await logging_service.log_error(
                error_type=type(exc).__name__,
                error_message=str(exc),
                stack_trace=traceback.format_exc(),
                severity="ERROR",
                user_id=user_id,
                wallet_address=wallet_address,
                request_id=request_id,
                endpoint=request.url.path,
                method=request.method,
                additional_context={
                    "duration_ms": duration_ms,
                    "query_params": dict(request.query_params),
                },
            )

            raise