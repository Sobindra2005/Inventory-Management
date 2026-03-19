from datetime import timedelta

import jwt
from fastapi import HTTPException, status

from app.core.config import settings

import logging

logger = logging.getLogger(__name__)



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

# Convert escaped newlines to actual newlines (for .env file compatibility)
PUBLIC_KEY = settings.PUBLIC_KEY.replace('\\n', '\n')
ALGORITHM = settings.CLERK_JWT_ALGORITHM.strip()
AUDIENCE = settings.CLERK_JWT_AUDIENCE
JWT_LEEWAY_SECONDS = 60


def verify_clerk_jwt(token: str) -> dict:
    """
    Verify the JWT and return payload.
    Raises 401 if invalid.
    """
    try:
        if ALGORITHM.startswith("RS") and not PUBLIC_KEY.strip().startswith("-----BEGIN"):
            logger.warning(
                "Configured %s but PUBLIC_KEY is not a PEM public key. Use Clerk JWT verification key/JWKS public key, not secret key.",
                ALGORITHM,
            )

        token_header = jwt.get_unverified_header(token)
        token_alg = token_header.get("alg")

        logger.info(
            "Verifying JWT: token_alg=%s, expected_alg=%s, aud=%s",
            token_alg,
            ALGORITHM,
            AUDIENCE,
        )

        if token_alg and token_alg != ALGORITHM:
            logger.warning(
                "JWT alg mismatch: token alg=%s, configured alg=%s",
                token_alg,
                ALGORITHM,
            )

        decode_kwargs = {
            "key": PUBLIC_KEY,
            "algorithms": [ALGORITHM],
            "leeway": JWT_LEEWAY_SECONDS,
        }
        if AUDIENCE:
            decode_kwargs["audience"] = AUDIENCE

        payload = jwt.decode(token, **decode_kwargs)

        logger.info(
            "JWT decoded: sub=%s iss=%s aud=%s",
            payload.get("sub"),
            payload.get("iss"),
            payload.get("aud"),
        )

        return payload
    except jwt.InvalidAlgorithmError as error:
        logger.warning(
            "JWT algorithm issue: %s (token_alg/configured_alg=%s/%s)",
            str(error),
            jwt.get_unverified_header(token).get("alg") if token else None,
            ALGORITHM,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.PyJWTError as error:
        logger.warning("JWT decode failed: %s", str(error))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

