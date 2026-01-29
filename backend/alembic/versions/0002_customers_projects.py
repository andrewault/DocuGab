"""add customers and projects

Revision ID: 0002_customers_projects
Revises: 0001_initial
Create Date: 2026-01-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_customers_projects'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create customers table
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('contact_name', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_customers_id', 'customers', ['id'])

    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('subdomain', sa.String(63), nullable=False),
        sa.Column('logo', sa.String(500), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('subtitle', sa.String(500), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('color_primary', sa.String(7), nullable=False),
        sa.Column('color_secondary', sa.String(7), nullable=False),
        sa.Column('color_background', sa.String(7), nullable=False),
        sa.Column('avatar', sa.String(500), nullable=False),
        sa.Column('voice', sa.String(100), nullable=False),
        sa.Column('return_link', sa.String(500), nullable=True),
        sa.Column('return_link_text', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_projects_id', 'projects', ['id'])
    op.create_index('ix_projects_customer_id', 'projects', ['customer_id'])
    op.create_index('ix_projects_subdomain', 'projects', ['subdomain'], unique=True)
    op.create_index('ix_projects_is_active', 'projects', ['is_active'])

    # Add project_id to documents table
    op.add_column('documents', sa.Column('project_id', sa.Integer(), nullable=True))
    op.create_index('ix_documents_project_id', 'documents', ['project_id'])
    op.create_foreign_key('fk_documents_project', 'documents', 'projects', ['project_id'], ['id'], ondelete='CASCADE')

    # Seed data: Demo customer
    op.execute("""
        INSERT INTO customers (name, contact_name, contact_phone, is_active)
        VALUES ('Demo Customer', 'Demo Contact', '+1-555-0100', true)
    """)

    # Seed data: Demo projects
    op.execute("""
        INSERT INTO projects (
            customer_id, name, slug, subdomain, title, subtitle, body,
            color_primary, color_secondary, color_background, avatar, voice, is_active
        )
        VALUES 
        (
            1, 
            'Employee Handbook', 
            'handbook', 
            'demo-handbook',
            'Employee Resources',
            'Your guide to company policies and procedures',
            'Welcome! Ask me anything about our employee handbook.',
            '#1976d2',
            '#dc004e',
            '#ffffff',
            '/assets/avatars/avatar.glb',
            'en-US-Neural2-F',
            true
        ),
        (
            1,
            'Customer Support',
            'support',
            'demo-support',
            'Help Center',
            'Get instant answers to common questions',
            'I am here to help! Search our knowledge base or ask me a question.',
            '#2e7d32',
            '#ed6c02',
            '#f5f5f5',
            '/assets/avatars/character.glb',
            'en-US-Neural2-D',
            true
        )
    """)


def downgrade() -> None:
    # Remove project_id from documents
    op.drop_constraint('fk_documents_project', 'documents', type_='foreignkey')
    op.drop_index('ix_documents_project_id', 'documents')
    op.drop_column('documents', 'project_id')
    
    # Drop projects table
    op.drop_index('ix_projects_is_active', 'projects')
    op.drop_index('ix_projects_subdomain', 'projects')
    op.drop_index('ix_projects_customer_id', 'projects')
    op.drop_index('ix_projects_id', 'projects')
    op.drop_table('projects')
    
    # Drop customers table
    op.drop_index('ix_customers_id', 'customers')
    op.drop_table('customers')
