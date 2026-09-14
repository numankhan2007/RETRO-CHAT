import json
import asyncio
import redis.asyncio as aioredis
from fastapi import WebSocket
from app.core.config import settings

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.redis: aioredis.Redis | None = None
        self.pubsub = None
        self.channel_name = "chat_messages"

    async def connect_redis(self):
        if settings.redis_url and self.redis is None:
            self.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            self.pubsub = self.redis.pubsub()
            await self.pubsub.subscribe(self.channel_name)
            asyncio.create_task(self._listen_to_redis())

    async def _listen_to_redis(self):
        if not self.pubsub:
            return
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    target_user_id = data.get("user_id")
                    payload = data.get("payload")
                    
                    if target_user_id in self.active_connections:
                        for ws in list(self.active_connections[target_user_id]):
                            try:
                                await ws.send_json(payload)
                            except Exception:
                                pass
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Redis PubSub Error: {e}")

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        if self.redis:
            await self.redis.sadd("online_users", user_id)

    async def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                self.active_connections.pop(user_id, None)
                if self.redis:
                    await self.redis.srem("online_users", user_id)

    async def send_to_user(self, user_id: int, message: dict):
        if self.redis:
            # Publish to Redis so all workers receive it
            payload = json.dumps({"user_id": user_id, "payload": message})
            await self.redis.publish(self.channel_name, payload)
        else:
            # Fallback to local memory if Redis is unavailable
            if user_id in self.active_connections:
                for ws in list(self.active_connections[user_id]):
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass

    async def is_online(self, user_id: int) -> bool:
        if self.redis:
            return await self.redis.sismember("online_users", user_id)
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

manager = ConnectionManager()
