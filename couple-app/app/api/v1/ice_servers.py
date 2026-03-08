"""
app/api/v1/ice_servers.py

REST API for providing WebRTC ICE server configuration.

RESPONSIBILITIES:
- Return STUN/TURN servers
- Hide TURN credentials from frontend logic
- Allow environment-based configuration

SECURITY:
- Authenticated users only
- Credentials can be rotated later
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.api.deps import get_current_user
from app.models.user import User
from app.config import settings


router = APIRouter(prefix="/ice", tags=["Video Call"])


# ---------------------------------------------------------
# RESPONSE SCHEMA
# ---------------------------------------------------------

class IceServersResponse(BaseModel):
    iceServers: List[Dict[str, Any]]


# ---------------------------------------------------------
# ICE SERVERS ENDPOINT
# ---------------------------------------------------------

@router.get("/servers", response_model=IceServersResponse)
def get_ice_servers(
    _: User = Depends(get_current_user),
):
    """
    Returns ICE server configuration for WebRTC.

    Frontend usage:
    new RTCPeerConnection({ iceServers })
    """

    ice_servers: List[Dict[str, Any]] = [
        # -----------------------------
        # STUN (FREE)
        # -----------------------------
        {
            "urls": [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
            ]
        }
    ]

    # -----------------------------
    # TURN (OPTIONAL BUT REQUIRED FOR PROD)
    # -----------------------------
    if settings.TURN_SERVER_URL:
        ice_servers.append(
            {
                "urls": [settings.TURN_SERVER_URL],
                "username": settings.TURN_USERNAME,
                "credential": settings.TURN_CREDENTIAL,
            }
        )

    return {"iceServers": ice_servers}
