"""add_name_to_couples

Revision ID: fe6886918e31
Revises: add_user_ids_to_couples
Create Date: 2025-12-21 19:08:03.726275

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe6886918e31'
down_revision: Union[str, Sequence[str], None] = 'add_user_ids_to_couples'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('couples', sa.Column('name', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('couples', 'name')
