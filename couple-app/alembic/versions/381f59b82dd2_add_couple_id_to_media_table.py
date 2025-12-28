"""add couple_id to media table

Revision ID: 381f59b82dd2
Revises: 09bd979ba891
Create Date: 2025-12-28 11:25:48.522274

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '381f59b82dd2'
down_revision: Union[str, Sequence[str], None] = '09bd979ba891'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('media', sa.Column('couple_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'media', 'couples', ['couple_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'media', type_='foreignkey')
    op.drop_column('media', 'couple_id')
