"""add_deleted_at_to_chat_messages

Revision ID: e28dff9ba236
Revises: 7e233a245728
Create Date: 2025-12-28 19:56:03.287249

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e28dff9ba236'
down_revision: Union[str, Sequence[str], None] = '7e233a245728'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
