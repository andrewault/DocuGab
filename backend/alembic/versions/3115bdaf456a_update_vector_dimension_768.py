"""update_vector_dimension_768

Revision ID: 3115bdaf456a
Revises: a7a7f3d2c0a4
Create Date: 2026-01-23 15:39:56.999350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '3115bdaf456a'
down_revision: Union[str, Sequence[str], None] = 'a7a7f3d2c0a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop existing embedding column and recreate with new dimension
    op.drop_column('chunks', 'embedding')
    op.add_column('chunks', sa.Column('embedding', Vector(768), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chunks', 'embedding')
    op.add_column('chunks', sa.Column('embedding', Vector(1536), nullable=True))
