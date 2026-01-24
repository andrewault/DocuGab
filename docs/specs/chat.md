# Chat Specification

## Overview

RAG (Retrieval-Augmented Generation) chat with streaming responses and source citations.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/` | Streaming chat (SSE) |
| POST | `/api/chat/query` | Non-streaming chat |

## Request Format

```json
{
  "question": "What is the main topic?",
  "document_ids": [1, 2, 3]  // Optional: filter to specific docs
}
```

## Response Format (Non-streaming)

```json
{
  "answer": "The main topic is...",
  "sources": [
    {
      "document_id": 1,
      "filename": "report.pdf",
      "page": 3,
      "content": "Relevant excerpt..."
    }
  ]
}
```

## Streaming Response (SSE)

```
data: {"token": "The"}
data: {"token": " main"}
data: {"token": " topic"}
...
data: {"done": true, "sources": [...]}
```

## RAG Pipeline

1. **Embed question** using Ollama (nomic-embed-text)
2. **Vector search** for similar chunks (top 5, cosine similarity)
3. **Build prompt** with retrieved context
4. **Generate response** with LLM (llama3.2)
5. **Stream tokens** back to client

## AI Configuration

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Embedding model | nomic-embed-text | `EMBEDDING_MODEL` |
| LLM model | llama3.2 | `LLM_MODEL` |
| Ollama URL | http://localhost:11434 | `OLLAMA_BASE_URL` |

## Vector Search

- **Database**: PostgreSQL with pgvector extension
- **Dimensions**: 768 (nomic-embed-text)
- **Operator**: `<=>` (cosine distance)
- **Limit**: Top 5 most relevant chunks

## Prompt Template

```
Use the following context to answer the question. If you cannot 
find the answer in the context, say so.

Context:
{retrieved_chunks}

Question: {user_question}

Answer:
```

## Chunk Model

```python
class Chunk:
    id: int
    document_id: int         # FK to documents
    content: str             # Chunk text
    page_number: int         # Source page
    chunk_index: int         # Order within document
    embedding: Vector(768)   # pgvector column
```
