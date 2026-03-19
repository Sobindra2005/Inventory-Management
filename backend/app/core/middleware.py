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
            except Exception:
                request.state.user_id = None
        else:
            request.state.user_id = None
        
        logger.info(f"Request: {request.method} {request.url} - User ID: {request.state.user_id}")
        
        response = await call_next(request)
        return response
