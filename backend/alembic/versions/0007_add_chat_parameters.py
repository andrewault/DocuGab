"""Add chat_parameters table

Revision ID: 0007_add_chat_parameters
Revises: f132c21888a2
Create Date: 2026-02-06

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from uuid import uuid4

# revision identifiers, used by Alembic.
revision = "0007_add_chat_parameters"
down_revision = "avatar_customer_scoped"
branch_labels = None
depends_on = None

# Preset templates
PRESETS = [
    {
        "name": "Balanced (Default)",
        "temperature": 0.2,
        "is_active": True,
        "system_prompt": """You are a friendly and conversational assistant. 
Answer questions based ONLY on the provided context, with the following exception:
- You may respond naturally to greetings (e.g., "Hello", "Hi") and conversational openers.

For all other queries:
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] format.

While strict about facts, engage the user warmly and be helpful.""",
    },
    {
        "name": "Strict Factual",
        "temperature": 0.1,
        "is_active": False,
        "system_prompt": """You are a precise, factual assistant.
Answer questions based STRICTLY on the provided context. Do not add any information not explicitly stated.

Rules:
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] format.
- Be concise and direct. Avoid speculation or elaboration beyond the source material.
- Prioritize accuracy over friendliness.""",
    },
    {
        "name": "Conversational",
        "temperature": 0.5,
        "is_active": False,
        "system_prompt": """You are a friendly, conversational assistant who loves to chat.
Answer questions based on the provided context, but feel free to be warm and engaging.

Guidelines:
- Be natural and conversational in your responses.
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] format.
- You may add helpful context or suggestions when appropriate.
- Engage warmly with greetings and casual conversation.""",
    },
    {
        "name": "Creative",
        "temperature": 0.8,
        "is_active": False,
        "system_prompt": """You are a creative, exploratory assistant who helps users brainstorm and discover ideas.
Use the provided context as a foundation, but feel free to make connections and suggest possibilities.

Approach:
- Draw insights from the provided context.
- If directly asked about facts not in context, acknowledge the limitation.
- Always cite your sources using [Source: filename] format when referencing documents.
- Be imaginative and help users explore ideas and connections.
- Encourage creative thinking and alternative perspectives.""",
    },
]


def upgrade() -> None:
    # Create chat_parameters table
    op.create_table(
        "chat_parameters",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("uuid", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=False, server_default="0.2"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chat_parameters_id", "chat_parameters", ["id"])
    op.create_index("ix_chat_parameters_uuid", "chat_parameters", ["uuid"], unique=True)

    # Seed preset templates
    for preset in PRESETS:
        escaped_prompt = preset["system_prompt"].replace("'", "''")
        op.execute(
            f"""
            INSERT INTO chat_parameters (uuid, name, system_prompt, temperature, is_active, created_at)
            VALUES (
                '{str(uuid4())}',
                '{preset["name"]}',
                '{escaped_prompt}',
                {preset["temperature"]},
                {str(preset["is_active"]).lower()},
                NOW()
            )
            """
        )


def downgrade() -> None:
    op.drop_index("ix_chat_parameters_uuid")
    op.drop_index("ix_chat_parameters_id")
    op.drop_table("chat_parameters")
