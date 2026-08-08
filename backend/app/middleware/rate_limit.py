import time
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.settings import settings
from app.database.redis import redis_client
from app.schemas.common import ErrorDetail, ErrorResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude docs and health check endpoints from rate limiting
        path = request.url.path
        if path.startswith(f"{settings.API_V1_STR}/health") or path in ["/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        current_minute = int(time.time() // 60)
        key = f"rate_limit:{client_ip}:{current_minute}"

        if redis_client:
            try:
                current_requests = await redis_client.incr(key)
                if current_requests == 1:
                    await redis_client.expire(key, 60)

                if current_requests > settings.RATE_LIMIT_PER_MINUTE:
                    logger.warning("rate_limit_exceeded", client_ip=client_ip, path=path)
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content=ErrorResponse(
                            success=False,
                            error=ErrorDetail(
                                code="RATE_LIMIT_EXCEEDED",
                                message="Too many requests. Please try again later.",
                            ),
                        ).model_dump(),
                    )
            except Exception as e:
                logger.warning("rate_limit_redis_error", error=str(e))

        return await call_next(request)
