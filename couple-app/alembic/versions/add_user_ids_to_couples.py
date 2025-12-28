"""add_user_ids_to_couples

Revision ID: add_user_ids_to_couples
Revises: e4f95830d32a
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_user_ids_to_couples'
down_revision: Union[str, Sequence[str], None] = 'e4f95830d32a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user1_id and user2_id columns to couples table
    op.add_column('couples', sa.Column('user1_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False))
    op.add_column('couples', sa.Column('user2_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False))

    # Add unique constraint to prevent duplicate couples
    op.create_unique_constraint('unique_couple_pair', 'couples', ['user1_id', 'user2_id'])

    # Add check constraint to prevent self-coupling
    op.create_check_constraint('prevent_self_couple', 'couples', 'user1_id != user2_id')


def downgrade() -> None:
    """Downgrade schema."""
    # Drop constraints first
    op.drop_constraint('prevent_self_couple', 'couples', type_='check')
    op.drop_constraint('unique_couple_pair', 'couples', type_='unique')

    # Drop columns
    op.drop_column('couples', 'user2_id')
    op.drop_column('couples', 'user1_id')
