from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import secrets
import string
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.pairing import PairingCode
from app.models.couple import Couple
from app.models.conversation import Conversation
from app.schemas.pairing import PairingInitiateResponse, PairingCompleteRequest, PairingCompleteResponse

router = APIRouter()

def generate_secret_code(length: int = 6) -> str:
    """
    Generates a secure, user-friendly secret code.
    Excludes confusing characters like O, 0, I, and l.
    """
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/pairing/initiate", response_model=PairingInitiateResponse)
def initiate_pairing(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Generates a secret code for the authenticated user to share.
    """
    if current_user.couple_id:
        raise HTTPException(status_code=400, detail="User is already in a partnership.")

    # Generate unique code
    code = generate_secret_code()
    while db.query(PairingCode).filter(PairingCode.code == code).first():
        code = generate_secret_code()

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    pairing_code = PairingCode(
        code=code,
        generating_user_id=current_user.id,
        expires_at=expires_at
    )
    db.add(pairing_code)
    db.commit()
    db.refresh(pairing_code)

    return PairingInitiateResponse(
        secretCode=code,
        expiresAt=expires_at.isoformat() + "Z",
        message="Share this code with your partner to pair your accounts."
    )

@router.post("/pairing/complete", response_model=PairingCompleteResponse)
def complete_pairing(
    request: PairingCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates a secret code and pairs the current user with the code's originator.
    """
    input_code = request.secretCode.upper().strip()

    if current_user.couple_id:
        raise HTTPException(status_code=400, detail="You are already in a partnership.")

    pairing_code = db.query(PairingCode).filter(PairingCode.code == input_code).first()

    if not pairing_code:
        raise HTTPException(status_code=404, detail="Invalid pairing code.")

    if pairing_code.generating_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot pair with yourself.")

    if pairing_code.used_at:
        raise HTTPException(status_code=400, detail="This code has already been used.")

    if datetime.now(timezone.utc) > pairing_code.expires_at:
        raise HTTPException(status_code=400, detail="This code has expired.")

    # Mark code as used
    pairing_code.used_at = datetime.now(timezone.utc)
    pairing_code.completing_user_id = current_user.id

    # Create couple
    couple = Couple(user1_id=pairing_code.generating_user_id, user2_id=current_user.id)
    db.add(couple)
    db.commit()
    db.refresh(couple)

    # Update users' couple_id
    db.query(User).filter(User.id == pairing_code.generating_user_id).update({"couple_id": couple.id})
    db.query(User).filter(User.id == current_user.id).update({"couple_id": couple.id})
    db.commit()

    return PairingCompleteResponse(message="Pairing successful! You are now connected with your partner.")
