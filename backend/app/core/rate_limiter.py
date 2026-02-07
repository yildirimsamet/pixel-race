
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from app.core.logging_config import get_logger
from app.core.config import settings

logger = get_logger(__name__)


class RateLimiter:


    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.window_seconds = 60

    def _get_client_id(self, request: Request) -> str:

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                pass
            except:
                pass

        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("User-Agent", "unknown")
        return f"{client_ip}:{user_agent}"

    def _clean_old_requests(self, client_id: str, current_time: float):

        cutoff_time = current_time - self.window_seconds
        self.requests[client_id] = [
            (ts, count) for ts, count in self.requests[client_id]
            if ts > cutoff_time
        ]

    def is_allowed(self, request: Request, max_requests: int) -> Tuple[bool, int, int]:

        if not settings.RATE_LIMIT_ENABLED:
            return True, 0, max_requests

        client_id = self._get_client_id(request)
        current_time = time.time()

        self._clean_old_requests(client_id, current_time)

        current_count = sum(count for _, count in self.requests[client_id])

        if current_count >= max_requests:
            logger.warning(
                f"Rate limit exceeded for client {client_id[:20]}... "
                f"({current_count}/{max_requests} requests)"
            )
            return False, current_count, max_requests

        self.requests[client_id].append((current_time, 1))
        return True, current_count + 1, max_requests


rate_limiter = RateLimiter()


async def rate_limit_dependency(request: Request):

    is_allowed, current, maximum = rate_limiter.is_allowed(
        request,
        settings.RATE_LIMIT_PER_MINUTE
    )

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {maximum} requests per minute.",
            headers={"Retry-After": "60"}
        )

    return True