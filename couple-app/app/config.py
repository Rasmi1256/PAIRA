"""Configuration settings with a resilient import for BaseSettings.

Try to import `BaseSettings` from `pydantic_settings` (used by pydantic v2
settings package). If that import isn't available (older pydantic v1
installations), fall back to `pydantic.BaseSettings`.
"""

try:
    # preferred for pydantic v2 settings package
    from pydantic_settings import BaseSettings  # type: ignore
except Exception:
    # fallback for pydantic v1 (or environments without pydantic_settings)
    from pydantic import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://couple:couplepass@localhost:5434/coupledb"
    SECRET_KEY: str = "771d383343e7efbb45f2376491c7a9eb2dab03e8a17fdc1c24b3d88be9208e75"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = "dummy_google_client_id"
    GOOGLE_CLIENT_SECRET: str ="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" 
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/callback"  # Example for a frontend running on port 3000

    AWS_S3_BUCKET_NAME: str = "bithuli-bucket"
    AWS_S3_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = "AKIA2OAJT44D2BI7RS7Y"
    AWS_SECRET_ACCESS_KEY: str = "NiD+z0OTa0TCPd1SRuiaiCr9KuPOTflQEu89g7lY"
    # WebAuthn / Passkeys
    RP_ID: str = "localhost"  # Relying Party ID (your domain)
    RP_NAME: str = "CoupleApp"
    ORIGIN: str = "http://localhost:3000" # The origin of your frontend app


settings = Settings()
