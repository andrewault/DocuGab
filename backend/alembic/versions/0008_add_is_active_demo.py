"""Add is_active_demo field to projects

Revision ID: 0008_add_is_active_demo
Revises: 0007_add_chat_parameters
Create Date: 2026-02-06

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0008_add_is_active_demo"
down_revision = "0007_add_chat_parameters"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add is_active_demo column to projects table."""
    op.add_column(
        "projects",
        sa.Column(
            "is_active_demo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    """Remove is_active_demo column from projects table."""
    op.drop_column("projects", "is_active_demo")
