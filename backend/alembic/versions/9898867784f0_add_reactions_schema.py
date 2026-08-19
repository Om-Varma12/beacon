"""add_reactions_schema

Revision ID: 9898867784f0
Revises: df69e2f2ff74
Create Date: 2026-08-19 20:06:33.242148

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9898867784f0'
down_revision: Union[str, Sequence[str], None] = 'df69e2f2ff74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add like_count/dislike_count to hackathons and create hackathon_reactions table."""
    # Add like_count and dislike_count columns to hackathons (safe: IF NOT EXISTS)
    op.execute("""
        ALTER TABLE hackathons
        ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0
    """)

    # Create hackathon_reactions table (idempotent)
    op.execute("""
        CREATE TABLE IF NOT EXISTS hackathon_reactions (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            hackathon_id INTEGER NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
            reaction VARCHAR(10) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
            PRIMARY KEY (user_id, hackathon_id),
            CONSTRAINT chk_hackathon_reactions_reaction CHECK (reaction IN ('like', 'dislike'))
        )
    """)

    # Index to efficiently look up all reactions for a hackathon
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_hackathon_reactions_hackathon_id
        ON hackathon_reactions(hackathon_id)
    """)


def downgrade() -> None:
    """Remove reactions schema."""
    op.execute("DROP TABLE IF EXISTS hackathon_reactions")
    op.execute("ALTER TABLE hackathons DROP COLUMN IF EXISTS like_count")
    op.execute("ALTER TABLE hackathons DROP COLUMN IF EXISTS dislike_count")
