"""Initial migration - create all tables

Revision ID: add_token_hash_01
Revises:
Create Date: 2024-06-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_token_hash_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create couples table
    op.create_table('couples',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_couples_id'), 'couples', ['id'], unique=False)

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('couple_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['couple_id'], ['couples.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create couple_invites table
    op.create_table('couple_invites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('couple_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('used', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['couple_id'], ['couples.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_couple_invites_id'), 'couple_invites', ['id'], unique=False)
    op.create_index(op.f('ix_couple_invites_token_hash'), 'couple_invites', ['token_hash'], unique=True)

    # Create magic_links table
    op.create_table('magic_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('used', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_magic_links_id'), 'magic_links', ['id'], unique=False)
    op.create_index(op.f('ix_magic_links_token_hash'), 'magic_links', ['token_hash'], unique=True)


def downgrade():
    op.drop_table('magic_links')
    op.drop_table('couple_invites')
    op.drop_table('users')
    op.drop_table('couples')
