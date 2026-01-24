# Document Upload, AI Integration & Chat

## Overview

This plan implements the core RAG (Retrieval-Augmented Generation) pipeline for DocuTalk, covering document upload, text extraction, chunking, embedding, vector storage, and conversational chat with source citations.

---

## Progress Tracking

| Phase | Task | Status |
|-------|------|--------|
| 1 | Install AI/ML dependencies | ⬜ Not Started |
| 2 | Implement document upload & storage | ⬜ Not Started |
| 3 | Implement text extraction (PDF, DOCX, TXT, MD) | ⬜ Not Started |
| 4 | Implement chunking with overlap | ⬜ Not Started |
| 5 | Implement embedding generation | ⬜ Not Started |
| 6 | Create RAG retrieval service | ⬜ Not Started |
| 7 | Implement chat endpoint with streaming | ⬜ Not Started |
| 8 | Build chat UI with source citations | ⬜ Not Started |
| 9 | Add document upload UI with progress | ⬜ Not Started |
| 10 | End-to-end testing | ⬜ Not Started |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Phase 1: Install AI/ML Dependencies

### Backend Dependencies

```bash
cd backend
uv add langchain langchain-ollama langchain-community
uv add pypdf python-docx
```

**Package purposes:**
- `langchain` — Orchestration framework for RAG pipeline
- `langchain-ollama` — Ollama LLM and embedding integration (local AI)
- `langchain-community` — Community integrations and utilities
- `pypdf` — PDF text extraction
- `python-docx` — DOCX text extraction

### Ollama Setup

Install Ollama and pull required models:

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull embedding model
ollama pull nomic-embed-text

# Pull LLM model
ollama pull llama3.2
```

### Environment Configuration

Add to project `.env`:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.2
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

---

## Phase 2: Document Upload & Storage

### 2.1 File Storage Service

**File:** `backend/app/services/storage.py`

```python
import os
import uuid
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads")

async def save_uploaded_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded file and return (stored_filename, original_filename)."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    
    ext = Path(file.filename).suffix
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / stored_filename
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    return stored_filename, file.filename
```

### 2.2 Enhanced Upload Endpoint

**File:** `backend/app/api/routes/documents.py`

```python
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # Validate file type
    allowed_types = {".pdf", ".docx", ".txt", ".md"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_types:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    
    # Save file
    stored_filename, original_filename = await save_uploaded_file(file)
    
    # Create document record
    document = Document(
        filename=stored_filename,
        original_filename=original_filename,
        content_type=file.content_type,
        file_size=file.size,
        status="pending"
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    # Trigger async processing (Phase 3-5)
    # background_tasks.add_task(process_document, document.id)
    
    return {"id": document.id, "status": "pending"}
```

---

## Phase 3: Text Extraction

### 3.1 Extraction Service

**File:** `backend/app/services/extraction.py`

```python
from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument

def extract_text(file_path: Path) -> list[dict]:
    """Extract text from file, returning list of {page, content}."""
    ext = file_path.suffix.lower()
    
    if ext == ".pdf":
        return extract_pdf(file_path)
    elif ext == ".docx":
        return extract_docx(file_path)
    elif ext in (".txt", ".md"):
        return extract_text_file(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def extract_pdf(file_path: Path) -> list[dict]:
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page": i, "content": text})
    return pages

def extract_docx(file_path: Path) -> list[dict]:
    doc = DocxDocument(file_path)
    text = "\n".join(p.text for p in doc.paragraphs)
    return [{"page": 1, "content": text}]

def extract_text_file(file_path: Path) -> list[dict]:
    text = file_path.read_text(encoding="utf-8")
    return [{"page": 1, "content": text}]
```

---

## Phase 4: Chunking with Overlap

### 4.1 Chunking Service

**File:** `backend/app/services/chunking.py`

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
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
        for chunk_text in page_chunks:
            chunks.append({
                "page": page_data["page"],
                "chunk_index": chunk_index,
                "content": chunk_text
            })
            chunk_index += 1
    
    return chunks
```

---

## Phase 5: Embedding Generation

### 5.1 Embedding Service

**File:** `backend/app/services/embedding.py`

```python
from langchain_ollama import OllamaEmbeddings
from app.core.config import settings

embeddings_model = OllamaEmbeddings(
    model=settings.embedding_model,
    base_url=settings.ollama_base_url
)

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using Ollama."""
    return embeddings_model.embed_documents(texts)

def generate_embedding(text: str) -> list[float]:
    """Generate embedding for a single text."""
    return embeddings_model.embed_query(text)
```

### 5.2 Document Processing Pipeline

**File:** `backend/app/services/processor.py`

```python
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Document, Chunk
from app.services.extraction import extract_text
from app.services.chunking import chunk_text
from app.services.embedding import generate_embeddings

UPLOAD_DIR = Path("uploads")

async def process_document(document_id: int, db: AsyncSession):
    """Full pipeline: extract → chunk → embed → store."""
    
    # Get document
    document = await db.get(Document, document_id)
    if not document:
        raise ValueError(f"Document {document_id} not found")
    
    document.status = "processing"
    await db.commit()
    
    try:
        # Extract text
        file_path = UPLOAD_DIR / document.filename
        pages = extract_text(file_path)
        
        # Chunk text
        chunks = chunk_text(pages)
        
        # Generate embeddings (batch for efficiency)
        texts = [c["content"] for c in chunks]
        embeddings = generate_embeddings(texts)
        
        # Store chunks with embeddings
        for chunk_data, embedding in zip(chunks, embeddings):
            chunk = Chunk(
                document_id=document.id,
                content=chunk_data["content"],
                page_number=chunk_data["page"],
                chunk_index=chunk_data["chunk_index"],
                embedding=embedding
            )
            db.add(chunk)
        
        document.status = "ready"
        await db.commit()
        
    except Exception as e:
        document.status = "error"
        await db.commit()
        raise
```

---

## Phase 6: RAG Retrieval Service

### 6.1 Vector Search

**File:** `backend/app/services/retrieval.py`

```python
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Chunk, Document
from app.services.embedding import generate_embedding

async def search_similar_chunks(
    query: str,
    db: AsyncSession,
    document_id: int | None = None,
    limit: int = 5
) -> list[dict]:
    """
    Find chunks most similar to the query.
    Returns list of {content, page, document_id, similarity}.
    """
    query_embedding = generate_embedding(query)
    
    # pgvector cosine similarity search
    sql = text("""
        SELECT 
            c.id,
            c.content,
            c.page_number,
            c.document_id,
            d.original_filename,
            1 - (c.embedding <=> :embedding) as similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.status = 'ready'
        AND (:doc_id IS NULL OR c.document_id = :doc_id)
        ORDER BY c.embedding <=> :embedding
        LIMIT :limit
    """)
    
    result = await db.execute(sql, {
        "embedding": str(query_embedding),
        "doc_id": document_id,
        "limit": limit
    })
    
    return [
        {
            "id": row.id,
            "content": row.content,
            "page": row.page_number,
            "document_id": row.document_id,
            "filename": row.original_filename,
            "similarity": row.similarity
        }
        for row in result.fetchall()
    ]
```

---

## Phase 7: Chat Endpoint with Streaming

### 7.1 Chat Service

**File:** `backend/app/services/chat.py`

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings
from app.services.retrieval import search_similar_chunks

llm = ChatOllama(
    model=settings.llm_model,
    base_url=settings.ollama_base_url,
    streaming=True
)

SYSTEM_PROMPT = """You are a helpful document assistant. Answer questions based ONLY on the provided context. 
If the answer is not in the context, say "I couldn't find that information in the documents."
Always cite your sources using [Source: filename, Page X] format."""

async def generate_response(
    query: str,
    db,
    document_id: int | None = None
):
    """Generate a response with RAG context using Ollama."""
    
    # Retrieve relevant chunks
    chunks = await search_similar_chunks(query, db, document_id, limit=5)
    
    # Build context
    context = "\n\n---\n\n".join([
        f"[{c['filename']}, Page {c['page']}]:\n{c['content']}"
        for c in chunks
    ])
    
    # Generate response with streaming
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}")
    ]
    
    # Stream response
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield chunk.content
    
    # Return sources
    yield "\n\n**Sources:**\n"
    for c in chunks:
        yield f"- {c['filename']}, Page {c['page']}\n"
```

### 7.2 Chat Endpoint

**File:** `backend/app/api/routes/chat.py`

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.services.chat import generate_response

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    document_id: int | None = None

@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    return StreamingResponse(
        generate_response(request.query, db, request.document_id),
        media_type="text/event-stream"
    )
```

---

## Phase 8: Chat UI with Source Citations

### 8.1 Chat Page Component

**File:** `frontend/src/pages/Chat.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { 
  Box, Container, Paper, TextField, IconButton, 
  Typography, CircularProgress, Chip, Stack 
} from '@mui/material';
import { Send } from '@mui/icons-material';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { filename: string; page: number }[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });
      
      const reader = response.body?.getReader();
      let assistantContent = '';
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        assistantContent += text;
        
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantContent }
        ]);
      }
      
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: assistantContent }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </Typography>
              <Typography>{msg.content}</Typography>
            </Box>
          ))}
          {isLoading && <CircularProgress size={20} />}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question about your documents..."
            />
            <IconButton onClick={sendMessage} disabled={isLoading}>
              <Send />
            </IconButton>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
```

---

## Phase 9: Document Upload UI

### 9.1 Upload Component with Progress

**File:** `frontend/src/components/DocumentUpload.tsx`

```typescript
import { useState, useCallback } from 'react';
import { 
  Box, Paper, Typography, LinearProgress, 
  Button, List, ListItem, ListItemText, Chip 
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';

interface UploadedDoc {
  id: number;
  filename: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
}

export default function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setDocuments(prev => [...prev, { 
          id: data.id, 
          filename: file.name, 
          status: data.status 
        }]);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    }
  }, []);

  return (
    <Paper
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      sx={{
        p: 4,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'primary.main',
        cursor: 'pointer'
      }}
    >
      <CloudUpload sx={{ fontSize: 48, color: 'primary.main' }} />
      <Typography variant="h6">Drop documents here</Typography>
      <Typography color="text.secondary">PDF, DOCX, TXT, Markdown</Typography>
      
      {uploading && <LinearProgress sx={{ mt: 2 }} />}
      
      <List sx={{ mt: 2 }}>
        {documents.map((doc) => (
          <ListItem key={doc.id}>
            <ListItemText primary={doc.filename} />
            <Chip
              size="small"
              label={doc.status}
              color={doc.status === 'ready' ? 'success' : 'default'}
              icon={doc.status === 'ready' ? <CheckCircle /> : undefined}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
```

---

## Phase 10: End-to-End Testing

### 10.1 Verification Checklist

- [ ] Upload a PDF document
- [ ] Verify document appears with "processing" status
- [ ] Wait for status to change to "ready"
- [ ] Navigate to chat interface
- [ ] Ask a question about the document content
- [ ] Verify response streams in real-time
- [ ] Verify source citations appear
- [ ] Click source citation to verify page reference

### 10.2 Test Commands

```bash
# Upload a test document
curl -X POST http://localhost:8007/api/documents/upload \
  -F "file=@test.pdf"

# Check document status
curl http://localhost:8007/api/documents/

# Test chat
curl -X POST http://localhost:8007/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'
```

---

## Directory Structure (After Implementation)

```
backend/
├── app/
│   ├── api/routes/
│   │   ├── chat.py          # NEW
│   │   ├── documents.py     # ENHANCED
│   │   └── health.py
│   ├── services/            # NEW
│   │   ├── extraction.py    # Text extraction
│   │   ├── chunking.py      # Text chunking
│   │   ├── embedding.py     # Embedding generation
│   │   ├── retrieval.py     # Vector search
│   │   ├── chat.py          # RAG + LLM
│   │   ├── storage.py       # File storage
│   │   └── processor.py     # Pipeline orchestration
│   ├── core/
│   └── models/
├── uploads/                  # NEW - uploaded files

frontend/
├── src/
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Chat.tsx         # NEW
│   ├── components/
│   │   └── DocumentUpload.tsx # NEW
```

---

## Recommendations

### Immediate Next Steps
1. **Background Processing** — Use FastAPI BackgroundTasks for document processing
2. **Progress WebSocket** — Real-time status updates during processing
3. **Error Handling** — Graceful handling of extraction/embedding failures

### Performance
1. **Batch Embeddings** — Process chunks in batches (e.g., 50 at a time for Ollama)
2. **Caching** — Cache frequently accessed embeddings
3. **Async Processing** — Queue large documents for background processing
4. **GPU Acceleration** — Ensure Ollama uses GPU for faster inference

### Ollama Model Options
| Model | Use Case | Size |
|-------|----------|------|
| `nomic-embed-text` | Embeddings (768 dim) | 274MB |
| `llama3.2` | Chat/Reasoning | 2GB |
| `llama3.2:1b` | Lightweight chat | 1.3GB |
| `mistral` | Alternative chat | 4.1GB |

### Security
1. **File Validation** — Validate file contents, not just extensions
2. **Size Limits** — Enforce maximum file size (e.g., 50MB)
3. **Local-Only** — All AI processing stays on your machine (no data leaves)
