import asyncio
from langchain_aws import BedrockEmbeddings
from app.core.config import settings
import boto3

# Initialize embeddings model (lazy loading)
_embeddings_model = None


def get_embeddings_model() -> BedrockEmbeddings:
    """Get or create the embeddings model instance."""
    global _embeddings_model
    if _embeddings_model is None:
        client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        _embeddings_model = BedrockEmbeddings(
            client=client, model_id=settings.bedrock_embedding_model
        )
    return _embeddings_model


def _generate_embeddings_sync(texts: list[str]) -> list[list[float]]:
    """Synchronous embedding generation."""
    model = get_embeddings_model()
    return model.embed_documents(texts)


def _generate_embedding_sync(text: str) -> list[float]:
    """Synchronous single embedding generation."""
    model = get_embeddings_model()
    return model.embed_query(text)


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using Bedrock (async wrapper)."""
    return await asyncio.to_thread(_generate_embeddings_sync, texts)


async def generate_embedding(text: str) -> list[float]:
    """Generate embedding for a single text (async wrapper)."""
    return await asyncio.to_thread(_generate_embedding_sync, text)
