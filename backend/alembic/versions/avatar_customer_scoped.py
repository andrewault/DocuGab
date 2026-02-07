"""add customer-scoped avatars with GLB/FBX support

Revision ID: avatar_customer_scoped
Revises: 7a3b629dfbd1
Create Date: 2026-02-05 15:59:00.000000

This migration handles the case where the avatars table may already exist
(from an earlier migration that was applied but not tracked in alembic_version).
It restructures the existing table for customer-scoped avatars with GLB/FBX support.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "avatar_customer_scoped"
down_revision = "7a3b629dfbd1"  # add_uuid_to_media_and_links
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Check if avatars table already exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='avatars')"
        )
    )
    avatars_exists = result.scalar()

    if avatars_exists:
        # Avatars table exists from old schema - need to restructure it
        # First, check if it has the old schema (project_id column)
        result = conn.execute(
            sa.text(
                "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='avatars' AND column_name='project_id')"
            )
        )
        has_old_schema = result.scalar()

        if has_old_schema:
            # Old schema exists - drop and recreate
            op.drop_table("avatars")
            _create_avatars_table()
        else:
            # Table exists but may be partially migrated - ensure all columns exist
            _ensure_avatar_columns()
    else:
        # Fresh install - create the table
        _create_avatars_table()

    # Step 2: Add avatar_id to projects table if not exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='avatar_id')"
        )
    )
    has_avatar_id = result.scalar()

    if not has_avatar_id:
        op.add_column("projects", sa.Column("avatar_id", sa.Integer(), nullable=True))
        op.create_index(
            "ix_projects_avatar_id", "projects", ["avatar_id"], unique=False
        )
        op.create_foreign_key(
            "projects_avatar_id_fkey",
            "projects",
            "avatars",
            ["avatar_id"],
            ["id"],
            ondelete="SET NULL",
        )

    # Step 3: Seed the Default avatar if not exists
    result = conn.execute(
        sa.text("SELECT EXISTS(SELECT 1 FROM avatars WHERE name='Default')")
    )
    has_default = result.scalar()

    if not has_default:
        op.execute("""
            INSERT INTO avatars (uuid, name, file_path, file_extension, file_size, original_filename, is_active, created_at)
            VALUES (
                gen_random_uuid(),
                'Default',
                'default.glb',
                'glb',
                0,
                'default.glb',
                true,
                now()
            )
        """)

    # Step 4: Drop the old avatar string column from projects if exists
    result = conn.execute(
        sa.text(
            "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='avatar')"
        )
    )
    has_avatar_column = result.scalar()

    if has_avatar_column:
        op.drop_column("projects", "avatar")


def _create_avatars_table():
    """Create the new customer-scoped avatars table."""
    op.create_table(
        "avatars",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "customer_id", sa.Integer(), nullable=True
        ),  # NULL = global (Default avatar)
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_extension", sa.String(10), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index(op.f("ix_avatars_id"), "avatars", ["id"], unique=False)
    op.create_index(op.f("ix_avatars_uuid"), "avatars", ["uuid"], unique=True)
    op.create_index("ix_avatars_customer_id", "avatars", ["customer_id"], unique=False)

    # Partial unique index for Default avatar name
    op.execute(
        "CREATE UNIQUE INDEX ix_avatars_default_unique ON avatars (name) WHERE name = 'Default'"
    )


def _ensure_avatar_columns():
    """Ensure all required columns exist on an existing avatars table."""
    conn = op.get_bind()

    # Check and add missing columns
    columns_to_add = [
        ("customer_id", "INTEGER"),
        ("name", "VARCHAR(255)"),
        ("file_path", "VARCHAR(500)"),
        ("file_extension", "VARCHAR(10)"),
        ("thumbnail_url", "VARCHAR(500)"),
    ]

    for col_name, col_type in columns_to_add:
        result = conn.execute(
            sa.text(
                f"SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='avatars' AND column_name='{col_name}')"
            )
        )
        if not result.scalar():
            if col_name == "customer_id":
                op.add_column(
                    "avatars", sa.Column("customer_id", sa.Integer(), nullable=True)
                )
            elif col_name == "name":
                op.add_column(
                    "avatars",
                    sa.Column(
                        "name", sa.String(255), nullable=False, server_default="Unnamed"
                    ),
                )
            elif col_name == "file_path":
                op.add_column(
                    "avatars",
                    sa.Column(
                        "file_path", sa.String(500), nullable=False, server_default=""
                    ),
                )
            elif col_name == "file_extension":
                op.add_column(
                    "avatars",
                    sa.Column(
                        "file_extension",
                        sa.String(10),
                        nullable=False,
                        server_default="glb",
                    ),
                )
            elif col_name == "thumbnail_url":
                op.add_column(
                    "avatars", sa.Column("thumbnail_url", sa.String(500), nullable=True)
                )


def downgrade() -> None:
    # Add avatar string column back
    op.add_column(
        "projects",
        sa.Column("avatar", sa.String(500), nullable=False, server_default="default"),
    )
    op.alter_column("projects", "avatar", server_default=None)

    # Remove avatar_id from projects
    op.drop_constraint("projects_avatar_id_fkey", "projects", type_="foreignkey")
    op.drop_index("ix_projects_avatar_id", table_name="projects")
    op.drop_column("projects", "avatar_id")

    # Drop indexes and table
    op.execute("DROP INDEX IF EXISTS ix_avatars_default_unique")
    op.drop_index("ix_avatars_customer_id", table_name="avatars")
    op.drop_index(op.f("ix_avatars_uuid"), table_name="avatars")
    op.drop_index(op.f("ix_avatars_id"), table_name="avatars")
    op.drop_table("avatars")
