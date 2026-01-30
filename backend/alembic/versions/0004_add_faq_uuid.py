"""Add UUID to FAQs table

Revision ID: 0004_add_faq_uuid
Revises: 0003_add_uuids
Create Date: 2026-01-29 18:06:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0004_add_faq_uuid"
down_revision = "0003_add_uuids"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add uuid column to faqs table
    op.add_column(
        "faqs", sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=True)
    )

    # Generate UUIDs for existing records
    op.execute("""
        UPDATE faqs
        SET uuid = gen_random_uuid()
        WHERE uuid IS NULL
    """)

    # Make uuid non-nullable after populating
    op.alter_column("faqs", "uuid", nullable=False)

    # Add unique constraint and index
    op.create_unique_constraint("uq_faqs_uuid", "faqs", ["uuid"])
    op.create_index("ix_faqs_uuid", "faqs", ["uuid"])


def downgrade() -> None:
    # Drop index and constraint
    op.drop_index("ix_faqs_uuid", "faqs")
    op.drop_constraint("uq_faqs_uuid", "faqs", type_="unique")

    # Drop uuid column
    op.drop_column("faqs", "uuid")
