# Selectable Chat Parameters

## Overview

This plan outlines the implementation of configurable chat parameters that allow admins to customize how RAG responses are generated. The system will support multiple parameter presets with selectable system prompts and temperature settings.

## Data Model

### ChatParameter Model

**Table:** `chat_parameters`

| Column        | Type         | Description                          |
|---------------|--------------|--------------------------------------|
| id            | Integer      | Primary key                          |
| uuid          | UUID         | Public identifier                    |
| name          | String(100)  | Display name for the preset          |
| system_prompt | Text         | System prompt used for chat          |
| temperature   | Float        | LLM temperature (0.0 - 1.0)          |
| is_active     | Boolean      | Currently active preset (only one)   |
| created_at    | DateTime     | Creation timestamp                   |
| updated_at    | DateTime     | Last update timestamp                |

**Constraints:**
- Only one `ChatParameter` can have `is_active=True` at a time
- `temperature` should be validated between 0.0 and 1.0

---

## Backend Implementation

### 1. Model (`app/models/chat_parameter.py`)

```python
class ChatParameter(Base):
    __tablename__ = "chat_parameters"
    
    id = Column(Integer, primary_key=True)
    uuid = Column(UUID, default=uuid4, unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, default=0.2, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

### 2. Schemas (`app/schemas/chat_parameter.py`)

- `ChatParameterCreate` - name, system_prompt, temperature
- `ChatParameterUpdate` - Optional fields for partial updates
- `ChatParameterResponse` - Full response including uuid, is_active, timestamps

### 3. API Routes (`app/api/routes/admin_routes/chat_parameters.py`)

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/admin/chat-parameters`              | List all chat parameters       |
| GET    | `/admin/chat-parameters/active`       | Get active chat parameter      |
| POST   | `/admin/chat-parameters`              | Create new chat parameter      |
| GET    | `/admin/chat-parameters/{uuid}`       | Get specific chat parameter    |
| PUT    | `/admin/chat-parameters/{uuid}`       | Update chat parameter          |
| DELETE | `/admin/chat-parameters/{uuid}`       | Delete chat parameter          |
| POST   | `/admin/chat-parameters/{uuid}/activate` | Set as active parameter     |

### 4. Chat Service Integration (`app/services/chat.py`)

Modify `generate_response()` to:
1. Fetch the active `ChatParameter` from database
2. Use its `system_prompt` instead of hardcoded `SYSTEM_PROMPT`
3. Pass `temperature` to the LLM configuration

```python
async def get_active_chat_parameter(db: AsyncSession) -> ChatParameter:
    result = await db.execute(
        select(ChatParameter).where(ChatParameter.is_active == True)
    )
    return result.scalar_one_or_none()
```

---

## Frontend Implementation

### 1. Navigation

Add "Chat Parameters" item to `AdminSidebar.tsx`:
```tsx
{ label: 'Chat Parameters', icon: <Settings />, path: '/admin/chat-parameters' }
```

### 2. Pages

#### Chat Parameters List (`/admin/chat-parameters`)

- Display active parameter summary at top
- Sortable table with columns: Name, Temperature, Created, Actions
- "Select" button to activate a parameter
- "Edit" button to open edit page
- "Create New" button

#### Edit Chat Parameter (`/admin/chat-parameters/:uuid/edit`)

- **Name** - Text input
- **System Prompt** - Large textarea (multiline, ~10 rows)
- **Temperature** - Number input (0.0 - 1.0, step 0.1)
- Info icon next to Temperature that opens info modal
- Save/Cancel buttons

### 3. Temperature Info Modal

Display when info icon is clicked:

---

**Temperature Ranges:**

| Temperature   | Behavior                            | Use Case                                       |
| ------------- | ----------------------------------- | ---------------------------------------------- |
| **0.0 - 0.3** | Deterministic, focused, factual     | RAG, Q&A, fact retrieval, documentation lookup |
| **0.4 - 0.7** | Balanced creativity and consistency | Conversational assistants, general chat        |
| **0.8 - 1.0** | Creative, varied, exploratory       | Creative writing, brainstorming                |

**Recommended:**

A **low temperature (0.1 - 0.3)** is recommended to:

- Reduce hallucination risk
- Ensure consistent, grounded responses
- Keep answers close to the source documents

---

## Database Migration

Create Alembic migration:
1. Create `chat_parameters` table
2. Seed with default parameter (current hardcoded prompt, temperature=0.2, is_active=True)

---

## Recommendations

### Default System Prompt

Seed the database with the current production prompt as the default:

```
You are a friendly and conversational assistant. 
Answer questions based ONLY on the provided context, with the following exception:
- You may respond naturally to greetings (e.g., "Hello", "Hi") and conversational openers.

For all other queries:
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] format.

While strict about facts, engage the user warmly and be helpful.
```

### Preset Templates

Consider creating additional presets for common use cases:

| Preset Name       | Temperature | Description                           |
|-------------------|-------------|---------------------------------------|
| Strict Factual    | 0.1         | Maximum accuracy, minimal creativity  |
| Balanced (Default)| 0.2         | Good balance for RAG                  |
| Conversational    | 0.5         | More natural, friendly responses      |
| Creative          | 0.8         | For brainstorming, exploratory chat   |

### Validation

- Prevent deletion of the active chat parameter
- Validate temperature range (0.0 - 1.0)
- Require non-empty system prompt

### Caching

Consider caching the active `ChatParameter` to avoid database queries on every chat request. Invalidate cache when activation changes.

### Audit Trail

For compliance, consider logging when:
- Active parameter changes
- System prompt is modified
- Who made the change and when

---

## Implementation Order

1. **Backend Model & Migration** - Create model, migration, seed default
2. **Backend API Routes** - CRUD endpoints + activate endpoint
3. **Chat Service Integration** - Use active parameter in chat
4. **Frontend List Page** - Table with select/edit actions
5. **Frontend Edit Page** - Form with temperature info modal
6. **Testing** - Verify parameter changes affect chat responses
