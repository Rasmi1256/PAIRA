"""Configuration settings loaded exclusively from environment variables.

All secrets MUST be provided via environment variables or a .env file
(see .env.example).  No secret or credential has a default value here.
"""

try:
    # preferred for pydantic v2 settings package
    from pydantic_settings import BaseSettings  # type: ignore
except Exception:
    # fallback for pydantic v1 (or environments without pydantic_settings)
    from pydantic import BaseSettings

from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    DATABASE_URL: str

    # --- Security ---
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # --- Google OAuth ---
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    # --- AWS S3 ---
    AWS_S3_BUCKET_NAME: str
    AWS_S3_REGION: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str

    # --- WebAuthn / Passkeys ---
    RP_ID: str
    RP_NAME: str = "PAIRA"
    ORIGIN: str

    # --- Redis ---
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # ALLOWED_ORIGINS=https://paira.app,https://www.paira.app
    ALLOWED_ORIGINS: str = ""

    # --- TURN / WebRTC (optional) ---
    TURN_SERVER_URL: str | None = None
    TURN_USERNAME: str | None = None
    TURN_CREDENTIAL: str | None = None

    def get_allowed_origins(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a list, splitting on commas."""
        if not self.ALLOWED_ORIGINS:
            return []
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
