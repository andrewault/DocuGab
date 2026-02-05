# AWS Bedrock Migration (Claude 3.5 Haiku)

## Goal
Migrate the generative AI capabilities of DocuTok from self-hosted Ollama (Llama 3.2 / Nomic) to **AWS Bedrock** to achieve:
*   **Scale-to-Zero costs**: Pay only for inference tokens.
*   **Performance**: Faster inference with Claude 3.5 Haiku.
*   **Reliability**: Managed infrastructure (no GPU node maintenance).

## Architecture Changes

### 1. Models
We will replace the local models with AWS Bedrock managed models:

| Component | Current (Ollama) | New (Bedrock) | ID |
| :--- | :--- | :--- | :--- |
| **LLM** | Llama 3.2 | **Claude 3.5 Haiku** | `anthropic.claude-3-5-haiku-20241022-v1:0` |
| **Embeddings** | Nomic Embed Text | **Titan Text Embeddings v2** | `amazon.titan-embed-text-v2:0` |

> [!WARNING]
> **Re-indexing Required**: Changing the embedding model (Nomic -> Titan) changes the vector space. All existing document chunks must be deleted and regenerated.

### 2. Dependencies
*   Remove: `langchain-ollama`
*   Add: `langchain-aws`, `boto3`

## Implementation Steps

### Phase 1: Configuration & Infrastructure
1.  **IAM Permissions**: Ensure the backend pod (via ServiceAccount or Access Keys) has `bedrock:InvokeModel` permissions.
2.  **Environment Variables**: Update `.env`:
    ```ini
    # Remove OLLAMA_BASE_URL
    AWS_REGION=us-west-2
    BEDROCK_LLM_MODEL=anthropic.claude-3-5-haiku-20241022-v1:0
    BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
    ```

### Phase 2: App Code Updates
1.  **`app/core/config.py`**: Add AWS configuration settings.
2.  **`app/services/embedding.py`**:
    *   Replace `OllamaEmbeddings` with `BedrockEmbeddings`.
3.  **`app/services/chat.py`**:
    *   Replace `ChatOllama` with `ChatBedrock`.
    *   Ensure streaming (`astream`) works with the standard LangChain interface.

### Phase 3: Data Migration
Since embeddings change, we must "reset" the search index.
1.  **Truncate Chunks**: Delete all rows in the `chunks` table.
2.  **Reset Document Status**: Set all documents to `pending`.
3.  **Reprocess**: Trigger the chunking background task for all documents.

## Recommendations

### 1. Cost Control (Token Limits)
Claude 3.5 Haiku is cheap, but not free. Implement a hard limit on the number of tokens in `Settings` (e.g., `max_tokens=4096`) to prevent accidental cost runaways from loops or huge responses.

### 2. System Prompt Engineering
Claude responds differently than Llama.
*   **Action**: Review `SYSTEM_PROMPT` in `chat.py`. Claude prefers XML tags for structure (e.g., `<context>...</context>`).
*   **Cleanup**: Remove any "Llama-specific" anti-hallucination hacks; Claude is generally stricter by default.

### 3. Region Selection
Ensure both the Bedrock models are available in the chosen region (`us-west-2` usually has everything). Check specifically for Haiku.

### 4. Fallback Strategy
During development, you might want to keep the Ollama code behind a flag (`USE_BEDROCK=True`) to allow local development without AWS credentials, or simply use AWS credentials locally as well.
