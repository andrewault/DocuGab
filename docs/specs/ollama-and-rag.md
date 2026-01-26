# Ollama & RAG Specification

## Models

### Inference Engine
**System**: Ollama  
**Version Requirement**: >= 0.1.20  
**Connection**: HTTP JSON API  
**Default Base URL**: `http://localhost:11434`

### Language Model (LLM)
Used for: Chat generation, summarization.
- **Default Model**: `llama3.2`
- **Parameters**: 3B parameters (lightweight, runs on CPU/8GB RAM)
- **Context Window**: 4096 tokens (default)
- **Format**: GGUF (4-bit quantization recommended for standard laptops)

### Embedding Model
Used for: Vectorizing document chunks and search queries.
- **Default Model**: `nomic-embed-text`
- **Dimensions**: 768
- **Context Window**: 8192 tokens
- **Output Type**: Normalized Float32 List

## RAG Configuration

### Chunking Strategy
- **Method**: Recursive Character Text Splitter
- **Chunk Size**: 500 characters
- **Chunk Overlap**: 50 characters
- **Separators**: `["\n\n", "\n", " ", ""]`

### Retrieval Parameters
- **Metric**: Cosine Similarity
- **Top-K**: 5 chunks
- **Distance Threshold**: None (currently)
- **Reranker**: None (future scope)

## Prompt Engineering

### System Prompt
The system enforces a strict "Source-Based Answers Only" policy.

```text
You are a helpful document assistant. Answer questions based ONLY on the provided context. 
If the answer is not in the context, say "I couldn't find that information in the documents."
Always cite your sources using [Source: filename, Page X] format.
```

### Context Injection Format
Retrieved chunks are concatenated with a divider.

```text
[filename.pdf, Page 1]:
{content}

---

[filename.pdf, Page 2]:
{content}
```

## Vector Database Spec

### Extension
- **Name**: `vector` (pgvector)
- **Version**: >= 0.5.0

### Schema Constraints
**Table**: `chunks`

| Column | Type | Description |
| :--- | :--- | :--- |
| `embedding` | `vector(768)` | Must match embedding model dimensions |
| `content` | `text` | Raw text content of the chunk |
| `page_number` | `integer` | 1-based index |

### Indexing
- **Index Type**: IVFFlat or HNSW (Hierarchical Navigable Small World)
- **Lists**: 100 (default recommendation for < 1M rows)
- **Probes**: 10 (search query parameter)
