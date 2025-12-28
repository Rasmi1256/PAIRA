import secrets
from datetime import datetime, timedelta, UTC

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api.deps import get_db, get_current_user
from app.config import settings
from app.core.security import create_access_token, get_password_hash, hash_token, verify_password
from app.crud import crud_magic_link, crud_user
from app.schemas.auth import Token, LoginRequest
from app.schemas.magic_link import MagicLinkCreateOut, MagicLinkRequest
from app.schemas.user import UserCreate, UserRegister, UserOut
from app.models.couple import Couple
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
MAGIC_LINK_EXPIRE_MINUTES = 10

@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch partner details if user is in a couple
    partner_name = None
    partner_email = None
    partner_profile_picture_url = None
    if current_user.couple_id:
        couple = db.query(Couple).filter(Couple.id == current_user.couple_id).first()
        if couple:
            partner_id = couple.user1_id if couple.user2_id == current_user.id else couple.user2_id
            partner = db.query(User).filter(User.id == partner_id).first()
            if partner:
                partner_name = partner.full_name
                partner_email = partner.email
                partner_profile_picture_url = partner.profile_picture_url
                if partner_profile_picture_url:
                    from app.api.users import generate_signed_url
                    partner_profile_picture_url = generate_signed_url(partner_profile_picture_url)

    # Add partner details to the response
    user_data = current_user.__dict__.copy()
    user_data['partnerName'] = partner_name
    user_data['partnerEmail'] = partner_email
    user_data['partnerProfilePictureUrl'] = partner_profile_picture_url
    return user_data


@router.post("/register", response_model=Token)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    print(f"Registering user: {payload.email}")

    existing = crud_user.get_user_by_email(db, email=payload.email)
    if existing:
        print(f"Email {payload.email} already registered")
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the user
    user_create = UserCreate(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        google_id=None  # Regular signup, not Google
    )
    user = crud_user.create_user(db, user_in=user_create)
    print(f"Created user: {user.id}")

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.google_id and not user.hashed_password:
        raise HTTPException(status_code=400, detail="This account uses Google login. Please use Google sign-in.")

    # Allow login with any password if user has no password set (for partners who haven't set one yet)
    if not user.hashed_password:
        # Set the password on first login
        user.hashed_password = get_password_hash(payload.password)
        db.commit()
    elif not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/magic-login/request", response_model=MagicLinkCreateOut)
def request_magic_link(payload: MagicLinkRequest, db: Session = Depends(get_db)):
    """
    Request a magic link for passwordless login.
    In a real app, this would email a link to the user.
    For this demo, it returns the token directly.
    """
    user = crud_user.get_user_by_email(db, email=payload.email)
    if not user:
        # Note: For security, you might not want to reveal if an email exists.
        # A generic message is often better.
        raise HTTPException(status_code=404, detail="User with this email not found.")

    token = secrets.token_urlsafe(32)
    crud_magic_link.create_magic_link(
        db,
        user_id=user.id,
        token=token,
        expires_delta=timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES),
    )
    return {"token": token}

@router.get("/magic-login/verify", response_model=Token)
def verify_magic_link(token: str, db: Session = Depends(get_db)):
    token_hash = hash_token(token)
    link = crud_magic_link.get_magic_link_by_hash(db, token_hash=token_hash)

    if not link or link.used or link.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="Magic link is invalid or has expired")

    link.used = True
    db.commit()

    access_token = create_access_token(subject=str(link.user_id))
    return {"access_token": access_token, "token_type": "bearer"}

class GoogleLoginRequest(BaseModel):
    code: str

@router.post("/google/login", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Handle Google OAuth login/signup.
    1. Receives an authorization code from the frontend.
    2. Exchanges the code for an ID token with Google.
    3. Verifies the ID token.
    4. Finds or creates a user in the database.
    5. Returns an access token for the app.
    """
    try:
        # 1. Exchange authorization code for an ID token
        token_uri = "https://oauth2.googleapis.com/token"
        token_payload = {
            'code': payload.code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': 'postmessage',  # Required for web clients using 'auth-code' flow
            'grant_type': 'authorization_code',
        }
        token_response = requests.post(token_uri, data=token_payload)
        token_response.raise_for_status()
        google_tokens = token_response.json()
        
        # 2. Verify the ID token and extract user info
        id_info = id_token.verify_oauth2_token(
            google_tokens['id_token'], google_requests.Request(), settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300  # Allow 5 minutes clock skew to handle time sync issues
        )

        google_id = id_info['sub']
        email = id_info['email']
        full_name = id_info.get('name')

    except (requests.exceptions.RequestException, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {e}")

    # 3. Find or create user
    existing_user = crud_user.get_user_by_google_id(db, google_id=google_id)
    if existing_user:
        access_token = create_access_token(subject=str(existing_user.id))
        return {"access_token": access_token, "token_type": "bearer"}

    # 4. Or create a new user
    user_create = UserCreate(email=email, password=None, full_name=full_name, google_id=google_id)
    user = crud_user.create_user(db, user_in=user_create)
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}
