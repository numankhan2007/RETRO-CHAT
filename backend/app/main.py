import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from app.core.ws_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await manager.connect_redis()
    yield

app = FastAPI(title="Retro Chat API", lifespan=lifespan)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, friends, chat, blog, users, notifications, blocks, group

from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Depends, HTTPException
from app.db.database import get_db
from app.services.redis_service import redis_client
import redis

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "ok"}
    
    # Check DB
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        health_status["status"] = "error"
        health_status["db"] = "unreachable"
        
    # Check Redis
    if redis_client:
        try:
            redis_client.ping()
        except redis.exceptions.RedisError:
            health_status["status"] = "error"
            health_status["redis"] = "unreachable"
            
    if health_status["status"] == "error":
        raise HTTPException(status_code=503, detail=health_status)
        
    return health_status

app.include_router(auth.router)
app.include_router(friends.router)
app.include_router(chat.router)
app.include_router(blog.router)
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(blocks.router)
app.include_router(group.router)
