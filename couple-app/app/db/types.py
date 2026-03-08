"""
Cross-dialect UUID type for SQLAlchemy 1.4.

- PostgreSQL: stores as native UUID column.
- SQLite / other dialects: stores as CHAR(36) string.

Usage:
    from app.db.types import GUID
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
"""
import uuid
from sqlalchemy import types


class GUID(types.TypeDecorator):
    """Platform-independent GUID type (UUID on PG, CHAR(36) elsewhere)."""

    impl = types.CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(types.CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(str(value)))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(str(value))
