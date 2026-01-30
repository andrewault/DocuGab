"""add_email_to_customers

Revision ID: 9a5def593c9a
Revises: 0006_add_customer_id_to_users
Create Date: 2026-01-30 11:03:04.588931

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a5def593c9a'
down_revision: Union[str, Sequence[str], None] = '0006_add_customer_id_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add email column to customers table
    op.add_column("customers", sa.Column("email", sa.String(255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove email column from customers table
    op.drop_column("customers", "email")
