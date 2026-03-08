import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Environment variables are pre-configured in the root conftest.py,
# which pytest loads before this file.

# Import ALL models so Base.metadata contains every table before create_all.
import app.db.base  # noqa: F401  (side-effect: registers all ORM models)
from app.db.base_class import Base  # noqa: E402

TEST_DB_FILE = "./.test_sqlite.db"


@pytest.fixture(scope="session")
def test_db_url():
    return f"sqlite:///{TEST_DB_FILE}"


@pytest.fixture(scope="session")
def setup_test_db(test_db_url):
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)

    yield {
        "engine": engine,
        "session_factory": TestingSessionLocal,
    }

    try:
        engine.dispose()
    except Exception:
        pass
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)


@pytest.fixture(scope="function")
def client(setup_test_db, monkeypatch):
    """
    TestClient with the app's SessionLocal monkeypatched to the test SQLite DB.
    The base_url is set to http://testserver/api/v1 so that test helpers can
    use short paths like /auth/register (matching the router prefixes) without
    repeating /api/v1 everywhere in the test bodies.
    """
    import app.db.session as db_session_module
    monkeypatch.setattr(db_session_module, "SessionLocal", setup_test_db["session_factory"])
    try:
        monkeypatch.setattr(db_session_module, "engine", setup_test_db["engine"])
    except Exception:
        pass

    import app.main as app_main
    # base_url ends with /api/v1 so all relative paths in tests resolve correctly
    client = TestClient(app_main.app, base_url="http://testserver/api/v1")
    yield client
