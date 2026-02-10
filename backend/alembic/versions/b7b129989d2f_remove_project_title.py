"""remove_project_title

Revision ID: b7b129989d2f
Revises: 0008_add_is_active_demo
Create Date: 2026-02-10 12:53:43.310635

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7b129989d2f'
down_revision: Union[str, Sequence[str], None] = '0008_add_is_active_demo'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('projects', 'title')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('projects', sa.Column('title', sa.VARCHAR(length=255), autoincrement=False, nullable=True))
    # Populate title with name for rollback safety
    op.execute('UPDATE projects SET title = name')
    op.alter_column('projects', 'title', nullable=False)
