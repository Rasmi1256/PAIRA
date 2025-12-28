from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers.exceptions import WebAuthnException
from webauthn.helpers.structs import (
    AuthenticationCredential,
    PublicKeyCredentialCreationOptions,
    RegistrationCredential,
)

from app.api.deps import get_db
from app.config import settings
from app.core.security import create_access_token
from app.crud import crud_user, crud_webauthn
from app.schemas.auth import Token
from app.schemas.user import UserCreate

router = APIRouter(prefix="/webauthn", tags=["webauthn"])

# In-memory store for challenges.
# WARNING: This is not suitable for production. Use a proper cache like Redis.
challenge_store = {}


class RegistrationStartRequest(BaseModel):
    email: EmailStr
    full_name: str


class LoginStartRequest(BaseModel):
    email: EmailStr


@router.post("/register/start", response_model_exclude_none=True)
def registration_start(
    payload: RegistrationStartRequest, db: Session = Depends(get_db)
):
    """
    Start the WebAuthn registration process by generating registration options.
    """
    user = crud_user.get_user_by_email(db, email=payload.email)
    if user:
        raise HTTPException(
            status_code=400, detail="Email is already registered."
        )

    options: PublicKeyCredentialCreationOptions = generate_registration_options(
        rp_id=settings.RP_ID,
        rp_name=settings.RP_NAME,
        user_name=payload.email,
        user_display_name=payload.full_name,
    )

    challenge_store[payload.email] = options.challenge
    return options.dict()


@router.post("/register/finish", response_model=Token)
def registration_finish(
    payload: RegistrationCredential,
    db: Session = Depends(get_db),
):
    """
    Finish the WebAuthn registration by verifying the client's response.
    """
    challenge = challenge_store.pop(payload.response.client_data.get("username"), None)
    if not challenge:
        raise HTTPException(status_code=400, detail="No registration challenge found for this user.")

    try:
        verified_credential = verify_registration_response(
            credential=payload,
            expected_challenge=challenge,
            expected_origin=settings.ORIGIN,
            expected_rp_id=settings.RP_ID,
        )
    except WebAuthnException as e:
        raise HTTPException(status_code=400, detail=f"Registration verification failed: {e}")

    # Create user
    user_in = UserCreate(email=payload.response.client_data["username"], full_name=payload.response.client_data.get("displayName", payload.response.client_data["username"]))
    user = crud_user.create_user(db, user_in=user_in)

    # Create WebAuthn credential
    crud_webauthn.create_credential(db, user_id=user.id, cred=verified_credential)

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/start", response_model_exclude_none=True)
def login_start(payload: LoginStartRequest, db: Session = Depends(get_db)):
    """
    Start the WebAuthn authentication process by generating authentication options.
    """
    user = crud_user.get_user_by_email(db, email=payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    credentials = crud_webauthn.get_credentials_by_user_id(db, user_id=user.id)
    if not credentials:
        raise HTTPException(status_code=404, detail="No passkeys found for this user.")

    options = generate_authentication_options(
        rp_id=settings.RP_ID,
        allow_credentials=[{"id": cred.credential_id, "type": "public-key"} for cred in credentials],
    )

    challenge_store[payload.email] = options.challenge
    return options.dict()


@router.post("/login/finish", response_model=Token)
def login_finish(
    payload: AuthenticationCredential,
    db: Session = Depends(get_db),
):
    """
    Finish the WebAuthn authentication by verifying the client's response.
    """
    user = crud_user.get_user_by_email(db, email=payload.response.client_data["username"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    challenge = challenge_store.pop(user.email, None)
    if not challenge:
        raise HTTPException(status_code=400, detail="No login challenge found for this user.")

    user_credentials = crud_webauthn.get_credentials_by_user_id(db, user_id=user.id)

    try:
        verification = verify_authentication_response(
            credential=payload,
            expected_challenge=challenge,
            expected_origin=settings.ORIGIN,
            expected_rp_id=settings.RP_ID,
            credential_public_keys=[cred.public_key for cred in user_credentials],
            credential_current_sign_counts=[cred.sign_count for cred in user_credentials],
        )
    except WebAuthnException as e:
        raise HTTPException(status_code=400, detail=f"Authentication verification failed: {e}")

    # Update the sign count to prevent replay attacks
    for cred in user_credentials:
        if cred.credential_id == verification.credential_id:
            cred.sign_count = verification.new_sign_count
            db.commit()
            break

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}
