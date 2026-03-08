from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from app.api import auth, couples, invites, users, uploads, gallery, pairing, calendar, journal
from app.db import base  # import models
from app.db.session import engine
from app.db.base_class import Base
from app.config import settings

app = FastAPI(title="PAIRA")


@app.get("/api/v1/health", tags=["health"])
async def health_check() -> JSONResponse:
    """Lightweight liveness probe used by Docker HEALTHCHECK and load balancers."""
    return JSONResponse({"status": "ok"})

# Configure CORS — origins are read from the ALLOWED_ORIGINS env variable.
# For local dev add http://localhost:3000 to that variable.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
os.makedirs("static/profile_pics", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(couples.router, prefix="/api/v1")
app.include_router(invites.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(gallery.router, prefix="/api/v1")
app.include_router(pairing.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(journal.router, prefix="/api/v1")

from app.chat.routes import router as chat_router
from app.chat.websocket import ws_router
from app.api.voice_message import router as voice_message_router
from app.api.v1.ice_servers import router as ice_router
from app.api.v1.video_call_history import router as video_call_history_router
from app.ws.video_call import video_call_ws

app.include_router(chat_router, prefix="/api/v1")
app.include_router(voice_message_router, prefix="/api/v1")
app.include_router(ice_router, prefix="/api/v1")
app.include_router(video_call_history_router, prefix="/api/v1")
app.include_router(ws_router)
app.add_api_websocket_route("/ws/video-call", video_call_ws)
