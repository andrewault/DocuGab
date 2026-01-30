"""Add user settings (theme and timezone)

Revision ID: 0005_add_user_settings
Revises: 0004_add_faq_uuid
Create Date: 2026-01-29 20:12:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_add_user_settings"
down_revision = "0004_add_faq_uuid"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add theme column (light/dark/system)
    op.add_column(
        "users",
        sa.Column("theme", sa.String(20), nullable=True, server_default="system"),
    )

    # Add timezone column (IANA timezone string)
    op.add_column(
        "users",
        sa.Column(
            "timezone",
            sa.String(50),
            nullable=True,
            server_default="America/Los_Angeles",
        ),
    )

    # Set default values for existing users
    op.execute("""
        UPDATE users
        SET theme = 'system', timezone = 'America/Los_Angeles'
        WHERE theme IS NULL OR timezone IS NULL
    """)

    # Make columns non-nullable after setting defaults
    op.alter_column("users", "theme", nullable=False)
    op.alter_column("users", "timezone", nullable=False)


def downgrade() -> None:
    # Drop the columns
    op.drop_column("users", "timezone")
    op.drop_column("users", "theme")
