import asyncio
import json
import logging
from collections import defaultdict

from fastapi import WebSocket
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.config import settings
from app.db.redis import get_redis

logger = logging.getLogger(__name__)


class RealtimeConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))

        if not sockets:
            return

        stale_sockets: list[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                stale_sockets.append(socket)

        for socket in stale_sockets:
            await self.disconnect(user_id, socket)


realtime_manager = RealtimeConnectionManager()


async def publish_realtime_event(user_id: str, event_type: str, data: dict) -> None:
    redis_client = get_redis()
    if redis_client is None:
        logger.warning("Redis unavailable, realtime event dropped for user_id=%s", user_id)
        return

    payload = {
        "userId": user_id,
        "type": event_type,
        "data": data,
    }

    await redis_client.publish(settings.WS_EVENTS_CHANNEL, json.dumps(payload, default=str))


async def listen_for_realtime_events(stop_event: asyncio.Event) -> None:
    redis_client = get_redis()
    if redis_client is None:
        logger.warning("Redis unavailable, realtime listener not started")
        return

    pubsub = redis_client.pubsub()
    await pubsub.subscribe(settings.WS_EVENTS_CHANNEL)
    logger.info("Realtime listener subscribed to channel=%s", settings.WS_EVENTS_CHANNEL)

    try:
        while not stop_event.is_set():
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.05)
                continue

            try:
                payload = json.loads(message["data"])
                user_id = payload.get("userId")
                if not user_id:
                    continue
                await realtime_manager.send_to_user(user_id, payload)
            except (json.JSONDecodeError, KeyError, TypeError) as error:
                logger.warning("Failed to parse realtime message: %s", error)
    except RedisConnectionError as error:
        logger.warning("Realtime listener redis connection error: %s", error)
    finally:
        await pubsub.unsubscribe(settings.WS_EVENTS_CHANNEL)
        await pubsub.close()
        logger.info("Realtime listener stopped")
