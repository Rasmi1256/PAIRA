"""
Create video_calls table

Revision ID: xxxx_create_video_calls
Revises: <previous_revision_id>
Create Date: 2026-02-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# ---------------------------------------------------------
# ALEMBIC IDENTIFIERS
# ---------------------------------------------------------

revision = "xxxx_create_video_calls"
down_revision = "<previous_revision_id>"
branch_labels = None
depends_on = None


# ---------------------------------------------------------
# ENUM DEFINITION
# ---------------------------------------------------------

video_call_status_enum = sa.Enum(
    "ringing",
    "active",
    "ended",
    "rejected",
    "missed",
    name="video_call_status",
)


# ---------------------------------------------------------
# UPGRADE
# ---------------------------------------------------------

def upgrade() -> None:
    # Create ENUM type
    video_call_status_enum.create(op.get_bind(), checkfirst=True)

    # Create video_calls table
    op.create_table(
        "video_calls",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "caller_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "callee_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "status",
            video_call_status_enum,
            nullable=False,
            server_default="ringing",
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "ended_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Optional but useful indexes
    op.create_index(
        "ix_video_calls_participants",
        "video_calls",
        ["caller_id", "callee_id"],
    )


# ---------------------------------------------------------
# DOWNGRADE
# ---------------------------------------------------------

def downgrade() -> None:
    op.drop_index("ix_video_calls_participants", table_name="video_calls")
    op.drop_table("video_calls")

    # Drop ENUM type
    video_call_status_enum.drop(op.get_bind(), checkfirst=True)
