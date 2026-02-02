import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.services.embedding import generate_embedding
from app.services.chat import get_llm
from langchain_core.messages import HumanMessage

async def main():
    print(f"Checking Ollama Configuration:")
    print(f"  Base URL: {settings.ollama_base_url}")
    print(f"  LLM Model: {settings.llm_model}")
    print(f"  Embedding Model: {settings.embedding_model}")
    print("-" * 20)

    print("Test 1: Connection to Ollama (Embeddings)...")
    try:
        emb = await generate_embedding("Hello world")
        print(f"  [SUCCESS] Generated embedding vector of length {len(emb)}")
    except Exception as e:
        print(f"  [FAILURE] Embedding generation failed: {e}")
        # Print traceback
        import traceback
        traceback.print_exc()

    print("\nTest 2: Connection to Ollama (Chat)...")
    try:
        llm = get_llm()
        msg = [HumanMessage(content="Hi there")]
        print("  Invoking stream...")
        async for chunk in llm.astream(msg):
            print(chunk.content, end="", flush=True)
        print("\n  [SUCCESS] Chat generation complete")
    except Exception as e:
        print(f"\n  [FAILURE] Chat generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
