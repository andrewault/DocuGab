from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings


def chunk_text(pages: list[dict]) -> list[dict]:
    """
    Split text into overlapping chunks.
    Returns list of {page, chunk_index, content}.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = []
    chunk_index = 0
    
    for page_data in pages:
        page_chunks = splitter.split_text(page_data["content"])
        for chunk_content in page_chunks:
            chunks.append({
                "page": page_data["page"],
                "chunk_index": chunk_index,
                "content": chunk_content
            })
            chunk_index += 1
    
    return chunks
