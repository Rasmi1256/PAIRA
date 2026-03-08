from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.invite import CoupleInvite
from app.models.couple import Couple
from app.models.user import User
from app.schemas.invite import InviteCreateOut
from datetime import datetime, timedelta, timezone
import secrets

from app.core.security import hash_token

router = APIRouter(tags=["invites"])

@router.post("/couples/{couple_id}/invites", response_model=InviteCreateOut)
def create_invite(couple_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.couple_id != couple_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    couple = db.query(Couple).filter(Couple.id == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    # Generate plaintext token to return to the caller only once
    raw_token = secrets.token_urlsafe(32)
    token_h = hash_token(raw_token)

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    invite = CoupleInvite(couple_id=couple.id, token_hash=token_h, expires_at=expires_at)
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Return plaintext token (only returned here). DB stores only the hash.
    return {"token": raw_token, "expires_at": invite.expires_at.isoformat()}


@router.post("/invites/accept")
def accept_invite(
    token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accept an invite in a transactionally safe way:
    - lookup invite by token hash
    - lock the invite row FOR UPDATE to prevent concurrent accept race
    - check invite validity, expiration, whether used
    - check couple partner count IN THE SAME TRANSACTION
    - mark invite used and attach user atomically
    """
    token_h = hash_token(token)

    try:
        # Row-level lock to prevent concurrent accept race
        invite = (
            db.query(CoupleInvite)
            .filter(CoupleInvite.token_hash == token_h)
            .with_for_update(nowait=False)
            .first()
        )
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid invite token")

        if invite.used:
            raise HTTPException(status_code=400, detail="Invite already used")

        if invite.expires_at and invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invite expired")

        couple = db.query(Couple).filter(Couple.id == invite.couple_id).first()
        if not couple:
            raise HTTPException(status_code=404, detail="Couple not found")

        # Count partners while holding locks to avoid race
        partners_count = db.query(User).filter(User.couple_id == couple.id).count()
        if partners_count >= 2:
            raise HTTPException(status_code=400, detail="Couple already full")

        # Attach user, set as user2, and mark invite used
        current_user.couple_id = couple.id
        couple.user2_id = current_user.id
        invite.used = True
        db.add(current_user)
        db.add(couple)
        db.add(invite)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not accept invite") from e

    return {"detail": "Joined couple", "couple_id": couple.id}

