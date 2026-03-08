"""
app/api/v1/video_call_history.py

REST API for fetching video call history.

RESPONSIBILITIES:
- Return call history for the current user
- Support pagination
- Never expose calls of other users

SECURITY:
- Authenticated users only
- Server-side filtering only
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.video_call import VideoCall
from app.models.user import User
from app.schemas.video_call import VideoCallResponse


router = APIRouter(prefix="/video-calls", tags=["Video Call"])


# ---------------------------------------------------------
# GET CALL HISTORY
# ---------------------------------------------------------

@router.get(
    "/history",
    response_model=List[VideoCallResponse],
)
def get_call_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns video call history for the authenticated user.

    Includes:
    - outgoing calls
    - incoming calls
    - missed / rejected / ended calls

    Ordered by most recent first.
    """

    calls = (
        db.query(VideoCall)
        .filter(
            or_(
                VideoCall.caller_id == current_user.id,
                VideoCall.callee_id == current_user.id,
            )
        )
        .order_by(desc(VideoCall.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return calls
