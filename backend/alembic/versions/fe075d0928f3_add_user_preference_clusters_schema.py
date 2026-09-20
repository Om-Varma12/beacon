from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'fe075d0928f3'
down_revision: Union[str, Sequence[str], None] = '9898867784f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')

    # Create hackathon_embeddings table
    op.create_table(
        'hackathon_embeddings',
        sa.Column('hackathon_id', sa.BigInteger(), nullable=False),
        sa.Column('structured_summary', sa.Text(), nullable=True),
        sa.Column('embedding', Vector(1536), nullable=False),
        sa.Column('embedding_model', sa.String(length=100), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('hackathon_id'),
        sa.ForeignKeyConstraint(['hackathon_id'], ['hackathons.id'], ondelete='CASCADE'),
    )

    # Create user_preference_clusters table
    op.create_table(
        'user_preference_clusters',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('embedding', Vector(1536), nullable=False),
        sa.Column('weight_sum', sa.Float(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_clusters_user_id', 'user_preference_clusters', ['user_id'], unique=False)
    op.execute('CREATE INDEX idx_clusters_embedding_hnsw ON user_preference_clusters USING hnsw (embedding vector_cosine_ops);')

    # Create user_actions audit log table
    op.create_table(
        'user_actions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('hackathon_id', sa.BigInteger(), nullable=False),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['hackathon_id'], ['hackathons.id'], ondelete='CASCADE'),
    )

    # Update jobs table check constraint
    op.execute('ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;')
    op.execute(
        "ALTER TABLE public.jobs ADD CONSTRAINT jobs_job_type_check CHECK ("
        "job_type = ANY (ARRAY['analysis', 'assets', 'scrape', 'embed_hackathon', 'match_hackathon', 'update_user_cluster']::text[])"
        ")"
    )


def downgrade() -> None:
    # Remove jobs check constraint update (optional to revert to exact previous state, but here we just remove the new one)
    op.execute('ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;')
    # Re-add original constraint if known, otherwise leave as is or handle carefully.
    # For this feature, we'll just drop the tables.

    op.drop_table('user_actions')
    op.drop_table('user_preference_clusters')
    op.drop_table('hackathon_embeddings')
    # We don't drop the vector extension as other things might use it.
