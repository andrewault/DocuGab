"""add_customer_role_to_users

Revision ID: 8553b89cd2e6
Revises: f132c21888a2
Create Date: 2026-02-01 10:16:42.982825

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8553b89cd2e6'
down_revision: Union[str, Sequence[str], None] = 'f132c21888a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add customer_role column to users table
    op.add_column('users', sa.Column('customer_role', sa.String(50), nullable=True))
    
    # Set the first user for each customer as 'owner', others as 'member'
    op.execute("""
        UPDATE users 
        SET customer_role = CASE
            WHEN id IN (
                SELECT MIN(id) 
                FROM users 
                WHERE customer_id IS NOT NULL AND customer_id = users.customer_id
                GROUP BY customer_id
            ) THEN 'owner'
            ELSE 'member'
        END
        WHERE customer_id IS NOT NULL
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'customer_role')
