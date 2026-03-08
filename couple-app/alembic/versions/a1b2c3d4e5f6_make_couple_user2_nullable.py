"""make couple user2_id nullable and fix check constraint

Revision ID: a1b2c3d4e5f6
Revises: 1787e3710359
Create Date: 2026-03-07

Changes:
- couples.user2_id: nullable=True (was NOT NULL) — partner joins later via invite
- couples.prevent_self_couple: updated CHECK to allow NULL user2_id
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '1787e3710359'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make user2_id nullable (partner hasn't joined yet when couple is created)
    with op.batch_alter_table('couples', schema=None) as batch_op:
        batch_op.alter_column(
            'user2_id',
            existing_type=sa.Integer(),
            nullable=True,
        )

    # Drop the old strict CHECK and replace with NULL-aware version
    op.execute("ALTER TABLE couples DROP CONSTRAINT IF EXISTS prevent_self_couple")
    op.execute(
        "ALTER TABLE couples ADD CONSTRAINT prevent_self_couple "
        "CHECK (user2_id IS NULL OR user1_id != user2_id)"
    )


def downgrade() -> None:
    # Restore original strict CHECK
    op.execute("ALTER TABLE couples DROP CONSTRAINT IF EXISTS prevent_self_couple")
    op.execute(
        "ALTER TABLE couples ADD CONSTRAINT prevent_self_couple "
        "CHECK (user1_id != user2_id)"
    )

    # Restore NOT NULL on user2_id (set a default first to avoid failures)
    op.execute("UPDATE couples SET user2_id = user1_id WHERE user2_id IS NULL")
    with op.batch_alter_table('couples', schema=None) as batch_op:
        batch_op.alter_column(
            'user2_id',
            existing_type=sa.Integer(),
            nullable=False,
        )
