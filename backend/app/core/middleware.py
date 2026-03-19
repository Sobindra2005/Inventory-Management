import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.jwt import verify_clerk_jwt


logger = logging.getLogger(__name__)


class ClerkAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = verify_clerk_jwt(token)
                request.state.user_id = payload.get("sub")
                logger.info(
                    "Auth verified for %s %s; user_id=%s",
                    request.method,
                    request.url.path,
                    request.state.user_id,
                )
            except Exception:
                request.state.user_id = None
                logger.warning(
                    "Auth verification failed for %s %s",
                    request.method,
                    request.url.path,
                )
        else:
            request.state.user_id = None
            logger.debug(
                "No bearer token on %s %s",
                request.method,
                request.url.path,
            )
        
        response = await call_next(request)
        return response
