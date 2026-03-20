from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from app.core.jwt import verify_clerk_jwt
from app.services.realtime import realtime_manager

router = APIRouter()


@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = verify_clerk_jwt(token)
    except HTTPException:
        await websocket.close(code=1008)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008)
        return

    await realtime_manager.connect(user_id, websocket)
    await realtime_manager.send_to_user(
        user_id,
        {
            "type": "connection",
            "data": {"status": "connected"},
            "userId": user_id,
        },
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await realtime_manager.disconnect(user_id, websocket)
