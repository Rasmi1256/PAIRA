"""add_pairing_codes_table

Revision ID: e4f95830d32a
Revises: ac6e802d38f2
Create Date: 2025-12-21 08:25:05.438165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f95830d32a'
down_revision: Union[str, Sequence[str], None] = 'ac6e802d38f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "pairing_codes",
        sa.Column("code", sa.String(8), primary_key=True),
        sa.Column("generating_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completing_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("pairing_codes")
