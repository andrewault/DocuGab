import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.services.chat import generate_response


async def main():
    print("Test 3: Full RAG Pipeline (DB + Ollama)...")
    try:
        async with AsyncSessionLocal() as db:
            print("  DB Connection opened.")
            # Use a dummy project ID that probably exists or use None if allowed?
            # The route requires project_id typically for multi-tenant, let's try with project_id=1
            print("  Invoking generate_response for 'San Diego'...")

            async for chunk in generate_response(
                query="Tell me about San Diego", db=db, project_id=1
            ):
                print(chunk, end="", flush=True)

            print("\n  [SUCCESS] RAG generation complete")
    except Exception as e:
        print(f"\n  [FAILURE] RAG pipeline failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
