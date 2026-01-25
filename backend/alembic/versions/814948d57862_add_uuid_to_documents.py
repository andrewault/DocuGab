"""add_uuid_to_documents

Revision ID: 814948d57862
Revises: b2c9d4e5f6a7
Create Date: 2026-01-24 23:36:18.846538

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '814948d57862'
down_revision: Union[str, Sequence[str], None] = 'b2c9d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add column as nullable first
    op.add_column('documents', sa.Column('uuid', sa.UUID(), nullable=True))
    
    # Generate UUIDs for existing documents
    connection = op.get_bind()
    documents = connection.execute(sa.text("SELECT id FROM documents WHERE uuid IS NULL"))
    for row in documents:
        connection.execute(
            sa.text("UPDATE documents SET uuid = :uuid WHERE id = :id"),
            {"uuid": str(uuid.uuid4()), "id": row[0]}
        )
    
    # Now make it not nullable and add index
    op.alter_column('documents', 'uuid', nullable=False)
    op.create_index(op.f('ix_documents_uuid'), 'documents', ['uuid'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_documents_uuid'), table_name='documents')
    op.drop_column('documents', 'uuid')
