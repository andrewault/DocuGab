"""add uuids to users, customers, and projects

Revision ID: 0003_add_uuids
Revises: 0002_customers_projects
Create Date: 2026-01-29

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0003_add_uuids"
down_revision = "0002_customers_projects"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add uuid column to users table
    op.add_column(
        "users",
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=True,  # Temporarily nullable for data migration
        ),
    )
    
    # Generate UUIDs for existing users
    op.execute("UPDATE users SET uuid = gen_random_uuid()")
    
    # Make uuid non-nullable and add unique constraint
    op.alter_column("users", "uuid", nullable=False)
    op.create_unique_constraint("uq_users_uuid", "users", ["uuid"])
    op.create_index("ix_users_uuid", "users", ["uuid"])

    # Add uuid column to customers table
    op.add_column(
        "customers",
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    
    # Generate UUIDs for existing customers
    op.execute("UPDATE customers SET uuid = gen_random_uuid()")
    
    # Make uuid non-nullable and add unique constraint
    op.alter_column("customers", "uuid", nullable=False)
    op.create_unique_constraint("uq_customers_uuid", "customers", ["uuid"])
    op.create_index("ix_customers_uuid", "customers", ["uuid"])

    # Add uuid column to projects table
    op.add_column(
        "projects",
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    
    # Generate UUIDs for existing projects
    op.execute("UPDATE projects SET uuid = gen_random_uuid()")
    
    # Make uuid non-nullable and add unique constraint
    op.alter_column("projects", "uuid", nullable=False)
    op.create_unique_constraint("uq_projects_uuid", "projects", ["uuid"])
    op.create_index("ix_projects_uuid", "projects", ["uuid"])


def downgrade() -> None:
    # Remove uuid from projects
    op.drop_index("ix_projects_uuid", "projects")
    op.drop_constraint("uq_projects_uuid", "projects", type_="unique")
    op.drop_column("projects", "uuid")

    # Remove uuid from customers
    op.drop_index("ix_customers_uuid", "customers")
    op.drop_constraint("uq_customers_uuid", "customers", type_="unique")
    op.drop_column("customers", "uuid")

    # Remove uuid from users
    op.drop_index("ix_users_uuid", "users")
    op.drop_constraint("uq_users_uuid", "users", type_="unique")
    op.drop_column("users", "uuid")
