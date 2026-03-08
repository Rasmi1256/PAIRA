import httpx
from fastapi import APIRouter, Body, Depends, HTTPException
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import settings
from app.core.security import create_access_token
from app.crud import crud_user
from app.schemas.auth import Token
from app.schemas.user import UserCreate

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.post("/google/login", response_model=Token)
async def login_google(
    *,
    db: Session = Depends(get_db),
    code: str = Body(..., embed=True),
):
    """
    OAuth2 login with Google.
    The frontend provides the authorization 'code' from Google's login flow.
    The backend exchanges this code for a token and uses it to identify or create the user.
    """
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=data)
            token_response.raise_for_status()  # Raise an exception for 4XX or 5XX status codes
            token_json = token_response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=400, detail=f"Failed to exchange code with Google: {e.response.text}"
            )

    raw_id_token = token_json.get("id_token")
    if not raw_id_token:
        raise HTTPException(status_code=400, detail="ID token not found in Google response")

    # Verify the ID-token signature and audience against Google's public keys.
    try:
        request = google_requests.Request()
        payload = google_id_token.verify_oauth2_token(
            raw_id_token,
            request,
            settings.GOOGLE_CLIENT_ID,
        )
        user_email = payload.get("email")
        user_name = payload.get("name")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {exc}")

    if not user_email:
        raise HTTPException(status_code=400, detail="Email not found in Google token payload")

    user = crud_user.get_user_by_email(db, email=user_email)
    if not user:
        user_in = UserCreate(email=user_email, full_name=user_name, password=None)
        user = crud_user.create_user(db, user_in=user_in)

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}