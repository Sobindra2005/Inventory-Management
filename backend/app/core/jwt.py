from datetime import timedelta

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
