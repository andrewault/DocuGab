"""add avatars table

Revision ID: add_avatars_001
Revises: 
Create Date: 2026-01-30 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_avatars_001'
down_revision = '9a5def593c9a'  # add_email_to_customers
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create avatars table
    op.create_table(
        'avatars',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_avatars_id'), 'avatars', ['id'], unique=False)
    op.create_index(op.f('ix_avatars_uuid'), 'avatars', ['uuid'], unique=True)
    op.create_index(op.f('ix_avatars_project_id'), 'avatars', ['project_id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_avatars_project_id'), table_name='avatars')
    op.drop_index(op.f('ix_avatars_uuid'), table_name='avatars')
    op.drop_index(op.f('ix_avatars_id'), table_name='avatars')
    
    # Drop table
    op.drop_table('avatars')
