from datetime import timedelta

import jwt
from fastapi import HTTPException, status

from app.core.config import settings


def parse_duration(value: str) -> timedelta:
    if not value or len(value) < 2:
        raise ValueError("Invalid duration format")

    unit = value[-1].lower()
    amount = int(value[:-1])

    if unit == "m":
        return timedelta(minutes=amount)
    if unit == "h":
        return timedelta(hours=amount)
    if unit == "d":
        return timedelta(days=amount)

    raise ValueError("Unsupported duration unit. Use m, h, or d")


JWT_SECRET = settings.JWT_SECRET
JWT_ACCESS_EXPIRES = parse_duration(settings.JWT_ACCESS_EXPIRATION)
JWT_REFRESH_EXPIRES = parse_duration(settings.JWT_REFRESH_EXPIRATION)

CLERK_JWT_KEY = settings.CLERK_JWT_KEY
ALGORITHM = settings.CLERK_JWT_ALGORITHM
AUDIENCE = settings.CLERK_JWT_AUDIENCE


def verify_clerk_jwt(token: str) -> dict:
    """
    Verify the JWT and return payload.
    Raises 401 if invalid.
    """
    try:
        decode_kwargs = {
            "key": CLERK_JWT_KEY,
            "algorithms": [ALGORITHM],
        }
        if AUDIENCE:
            decode_kwargs["audience"] = AUDIENCE

        payload = jwt.decode(token, **decode_kwargs)
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
