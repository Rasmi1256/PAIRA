import os
import tempfile
import shutil
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import application parts
import importlib
from app.db.base_class import Base

TEST_DB_FILE = "./.test_sqlite.db"

@pytest.fixture(scope="session")
def test_db_url():
    # Use a sqlite file DB for tests
    return f"sqlite:///{TEST_DB_FILE}"

@pytest.fixture(scope="session")
def setup_test_db(test_db_url):
    # ensure previous test DB removed
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # create tables
    Base.metadata.create_all(bind=engine)

    # yield objects for monkeypatching
    yield {
        "engine": engine,
        "session_factory": TestingSessionLocal,
    }

    # teardown: remove db file
    try:
        engine.dispose()
    except Exception:
        pass
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

@pytest.fixture(scope="function")
def client(setup_test_db, monkeypatch):
    """
    Create a TestClient where the app's SessionLocal is monkeypatched to use
    the test sqlite DB session factory.
    """
    # monkeypatch the app.db.session.SessionLocal
    import app.db.session as db_session_module
    monkeypatch.setattr(db_session_module, "SessionLocal", setup_test_db["session_factory"])

    # Also ensure any engine usage in app (if referenced) uses testing engine
    # Not strictly necessary for our scaffold, but safe:
    try:
        monkeypatch.setattr(db_session_module, "engine", setup_test_db["engine"])
    except Exception:
        pass

    # Now import the FastAPI app (ensure imports happen after monkeypatch)
    import app.main as app_main
    client = TestClient(app_main.app)
    yield client
