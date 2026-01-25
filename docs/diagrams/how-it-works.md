# How DocuTok Works

This document explains the core architecture and data flows in DocuTok.

## System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[User Interface]
        Auth[AuthContext]
        API[API Client]
    end
    
    subgraph Backend["Backend (FastAPI)"]
        Routes[API Routes]
        Services[Services]
        Models[SQLAlchemy Models]
    end
    
    subgraph Database["PostgreSQL + pgvector"]
        Users[(Users)]
        Documents[(Documents)]
        Chunks[(Chunks + Vectors)]
    end
    
    subgraph AI["Ollama (Local AI)"]
        Embed[nomic-embed-text]
        LLM[llama3.2]
    end
    
    UI --> Auth --> API
    API --> Routes --> Services
    Services --> Models --> Database
    Services <--> AI
```

## Document Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant S as Storage
    participant P as Processor
    participant O as Ollama
    participant DB as PostgreSQL

    U->>FE: Upload file
    FE->>BE: POST /api/documents/upload
    BE->>S: Save file to disk
    BE->>DB: Create document (status: pending)
    BE-->>FE: Return document ID
    
    Note over BE,P: Background Task
    BE->>P: process_document()
    P->>DB: Update status: processing
    P->>S: Read file content
    P->>P: Extract text (PDF/DOCX/TXT/MD)
    P->>P: Split into chunks (500 chars, 50 overlap)
    P->>O: Generate embeddings
    O-->>P: Return 768-dim vectors
    P->>DB: Store chunks with embeddings
    P->>DB: Update status: ready
    
    FE->>BE: Poll GET /api/documents/{id}
    BE-->>FE: Return status: ready
    FE-->>U: Show success
```

## RAG Chat Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant R as Retrieval
    participant O as Ollama
    participant DB as PostgreSQL

    U->>FE: Enter question
    FE->>BE: POST /api/chat/ (stream)
    
    BE->>O: Embed question
    O-->>BE: Question vector
    
    BE->>R: Find similar chunks
    R->>DB: Vector similarity search
    Note over DB: SELECT ... ORDER BY<br/>embedding <=> query_vec<br/>LIMIT 5
    DB-->>R: Top 5 relevant chunks
    R-->>BE: Context documents
    
    BE->>O: Generate response with context
    
    loop Streaming
        O-->>BE: Token
        BE-->>FE: SSE token
        FE-->>U: Display token
    end
    
    BE-->>FE: Source citations
    FE-->>U: Show sources
```

## Data Model

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : owns
    USERS ||--o{ SESSIONS : has
    DOCUMENTS ||--o{ CHUNKS : contains
    
    USERS {
        int id PK
        string email UK
        string password_hash
        string full_name
        string role
        boolean is_active
        boolean is_verified
        datetime created_at
    }
    
    SESSIONS {
        int id PK
        int user_id FK
        string refresh_token
        datetime expires_at
        boolean is_revoked
    }
    
    DOCUMENTS {
        int id PK
        int user_id FK
        string filename
        string original_filename
        string content_type
        int file_size
        string status
        string error_message
        datetime created_at
    }
    
    CHUNKS {
        int id PK
        int document_id FK
        text content
        int page_number
        int chunk_index
        vector embedding
    }
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    U->>FE: Enter credentials
    FE->>BE: POST /api/auth/login
    BE->>DB: Verify user
    BE->>BE: Verify password (bcrypt)
    BE->>DB: Create session
    BE-->>FE: Access token + Refresh token
    FE->>FE: Store tokens
    
    Note over FE,BE: Subsequent Requests
    FE->>BE: Request + Bearer token
    BE->>BE: Verify JWT
    BE-->>FE: Protected resource
    
    Note over FE,BE: Token Refresh
    FE->>BE: POST /api/auth/refresh
    BE->>DB: Validate refresh token
    BE->>DB: Rotate refresh token
    BE-->>FE: New access + refresh tokens
```

## Cascade Delete Behavior

```mermaid
flowchart TD
    User[Delete User] --> Documents[Delete Documents]
    Documents --> Chunks[Delete Chunks]
    Documents --> Files[Delete Files on Disk]
    
    style User fill:#ff6b6b
    style Documents fill:#ffa94d
    style Chunks fill:#ffd43b
    style Files fill:#a9e34b
```

| Action | Cascade Effect |
|--------|---------------|
| Delete User | All user's documents, chunks, and sessions are deleted |
| Delete Document | All chunks (with embeddings) are deleted |
| Delete Session | Only the session is deleted |
