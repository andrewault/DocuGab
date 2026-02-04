
import asyncio
import os
import sys
# Add app path
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from app.models import Document
from app.services.processor import process_document
from sqlalchemy import select

async def main():
    print("Starting document reprocessing...")
    async with AsyncSessionLocal() as db:
        # Fetch all pending documents
        result = await db.execute(select(Document).where(Document.status == 'pending'))
        documents = result.scalars().all()
        
        print(f"Found {len(documents)} pending documents.")
        
        for doc in documents:
            print(f"Processing document {doc.id}: {doc.filename}...")
            try:
                await process_document(doc.id, db)
                print(f"SUCCESS: Document {doc.id} processed.")
            except Exception as e:
                print(f"ERROR: Document {doc.id} failed: {e}")
                
    print("Reprocessing complete.")

if __name__ == "__main__":
    if os.getenv("AWS_REGION") is None:
        print("WARNING: AWS_REGION not set. Ensure environment is configured correctly.")
        
    asyncio.run(main())
