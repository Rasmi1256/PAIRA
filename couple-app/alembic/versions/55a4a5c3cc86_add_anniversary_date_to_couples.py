"""add_anniversary_date_to_couples

Revision ID: 55a4a5c3cc86
Revises: 381f59b82dd2
Create Date: 2025-12-28 19:36:14.655494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '55a4a5c3cc86'
down_revision: Union[str, Sequence[str], None] = '381f59b82dd2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('couples', sa.Column('anniversary_date', sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('couples', 'anniversary_date')
