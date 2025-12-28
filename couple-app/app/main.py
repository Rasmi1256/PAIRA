from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from app.api import auth, couples, invites, users, uploads, gallery, pairing
from app.db import base  # import models
from app.db.session import engine
from app.db.base_class import Base
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="CoupleApp - Step1")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
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

from app.chat.routes import router as chat_router
from app.chat.websocket import ws_router

app.include_router(chat_router, prefix="/api/v1")
app.include_router(ws_router)
