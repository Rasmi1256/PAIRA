"""
Root-level pytest conftest.
Sets all required environment variables BEFORE any app module is imported,
so pydantic-settings can initialise Settings() without errors.
"""
import os

# --- Required app settings (test values only, never used in production) ---
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sqlite.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-google-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:3000/callback")
os.environ.setdefault("AWS_S3_BUCKET_NAME", "test-bucket")
os.environ.setdefault("AWS_S3_REGION", "us-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test-key-id")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("RP_ID", "localhost")
os.environ.setdefault("ORIGIN", "http://localhost:3000")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
