"""add customer_id to users

Revision ID: 0006_add_customer_id_to_users
Revises: 0005_add_user_settings
Create Date: 2026-01-30 09:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0006_add_customer_id_to_users'
down_revision = '0005_add_user_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add customer_id column to users table
    op.add_column('users', sa.Column('customer_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_users_customer_id',
        'users',
        'customers',
        ['customer_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Add index for performance
    op.create_index('ix_users_customer_id', 'users', ['customer_id'])


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_users_customer_id', table_name='users')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_users_customer_id', 'users', type_='foreignkey')
    
    # Remove column
    op.drop_column('users', 'customer_id')
