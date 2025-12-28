"""Add webauthn_credentials table

Revision ID: 8836c1aaf361
Revises: add_token_hash_01
Create Date: 2025-12-03 20:20:00.001613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8836c1aaf361'
down_revision: Union[str, Sequence[str], None] = 'add_token_hash_01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('webauthn_credentials',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('credential_id', sa.LargeBinary(), nullable=False),
    sa.Column('public_key', sa.LargeBinary(), nullable=False),
    sa.Column('sign_count', sa.Integer(), nullable=False),
    sa.Column('transports', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('credential_id')
    )
    op.create_index(op.f('ix_webauthn_credentials_id'), 'webauthn_credentials', ['id'], unique=False)
    # In the User model, the hashed_password is now nullable
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_index(op.f('ix_webauthn_credentials_id'), table_name='webauthn_credentials')
    op.drop_table('webauthn_credentials')
    # ### end Alembic commands ###
