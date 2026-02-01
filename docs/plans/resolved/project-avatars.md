# Project Avatars Implementation Plan

## Overview

Add support for uploading and managing GAB (Generative Avatar Bundle) files for projects. This will allow customer users to upload custom avatars that can be used for AI interactions within their projects.

## Backend Changes

### 1. Avatar Model

Create a new `Avatar` model in `backend/app/models/avatar.py`:

```python
class Avatar(Base):
    __tablename__ = "avatars"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid4, unique=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)  # {uuid}.gab
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="avatars")
```

### 2. Update Project Model

Add relationship to `backend/app/models/project.py`:

```python
# Add to Project model
avatars = relationship("Avatar", back_populates="project", cascade="all, delete-orphan")
```

### 3. Database Migration

Create Alembic migration:
- Add `avatars` table
- Add foreign key to `projects.id`
- Add indexes on `uuid` and `project_id`

### 4. Storage Service

Update `backend/app/services/storage.py`:

```python
AVATAR_UPLOAD_DIR = Path("backend/uploads/avatars")

async def save_avatar_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded GAB file with UUID filename."""
    AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    avatar_uuid = uuid4()
    stored_filename = f"{avatar_uuid}.gab"
    file_path = AVATAR_UPLOAD_DIR / stored_filename
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return stored_filename, file.filename

def get_avatar_path(filename: str) -> Path:
    """Get full path to avatar file."""
    return AVATAR_UPLOAD_DIR / filename
```

### 5. Avatar Schemas

Create `backend/app/schemas/avatar.py`:

```python
class AvatarBase(BaseModel):
    project_id: int

class AvatarCreate(AvatarBase):
    pass

class AvatarResponse(AvatarBase):
    id: int
    uuid: UUID
    filename: str
    original_filename: str
    file_size: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

class AvatarListResponse(BaseModel):
    avatars: list[AvatarResponse]
    total: int
```

### 6. Avatar API Routes

Create `backend/app/api/routes/avatars.py`:

**Admin endpoints:**
- `POST /api/admin/projects/{project_uuid}/avatars` - Upload avatar
- `GET /api/admin/projects/{project_uuid}/avatars` - List avatars
- `DELETE /api/admin/avatars/{avatar_uuid}` - Delete avatar
- `GET /api/admin/avatars/{avatar_uuid}/download` - Download avatar file

**Customer endpoints:**
- `POST /api/customer/projects/{project_uuid}/avatars` - Upload avatar
- `GET /api/customer/projects/{project_uuid}/avatars` - List avatars
- `DELETE /api/customer/avatars/{avatar_uuid}` - Delete avatar (own project only)
- `GET /api/customer/avatars/{avatar_uuid}/download` - Download avatar file

### 7. File Validation

Add validation for GAB files:
- File extension must be `.gab`
- Maximum file size: 50MB
- Verify customer owns the project before upload

## Frontend Changes

### 1. Avatar Upload Component

Create `frontend/src/components/AvatarUpload.tsx`:
- File input accepting `.gab` files
- Upload progress indicator
- Preview of uploaded avatars
- Delete functionality

### 2. Project Detail Enhancement

Update `CustomerProjectDetail.tsx`:
- Add "Project Avatar" section after project details
- Display current avatar if exists
- Show upload button
- Allow deletion of avatar

### 3. Avatar Management Page (Optional)

Create `CustomerProjectAvatars.tsx`:
- List all avatars for a project
- Upload new avatar
- Set active avatar
- Delete avatars

## API Integration

### Upload Flow

1. Customer navigates to project detail page
2. Clicks "Upload Avatar" button
3. Selects `.gab` file from file system
4. File is validated client-side (extension, size)
5. File is uploaded via `POST /api/customer/projects/{uuid}/avatars`
6. Backend validates project ownership
7. File is saved to `backend/uploads/avatars/{uuid}.gab`
8. Avatar record is created in database
9. Success response returned with avatar details
10. UI updates to show uploaded avatar

### Download Flow

1. User clicks download button
2. Request sent to `GET /api/customer/avatars/{uuid}/download`
3. Backend verifies ownership
4. File is served with appropriate headers
5. Browser downloads file with original filename

## Security Considerations

1. **Access Control:**
   - Customers can only upload avatars to their own projects
   - Verify `project.customer_id == user.customer_id` before upload
   - Verify avatar ownership before download/delete

2. **File Validation:**
   - Validate file extension is `.gab`
   - Check file size limits (50MB max)
   - Sanitize original filename for storage

3. **Storage:**
   - Store files outside web root
   - Use UUID-based filenames to prevent conflicts
   - Implement file cleanup on avatar/project deletion

## Database Schema

```sql
CREATE TABLE avatars (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_avatars_uuid (uuid),
    INDEX idx_avatars_project_id (project_id)
);
```

## Recommendations

### 1. Single Active Avatar Per Project

Consider enforcing only one active avatar per project:
- Add unique constraint: `UNIQUE(project_id, is_active) WHERE is_active = TRUE`
- When uploading new avatar, automatically deactivate previous one
- Simplifies UI and reduces confusion

### 2. Avatar Versioning

Implement version tracking for avatars:
- Add `version` column to track iterations
- Keep historical avatars for rollback capability
- Display version history in UI

### 3. File Size Optimization

Add file size warnings and optimization:
- Show file size before upload
- Warn if file exceeds recommended size (e.g., 10MB)
- Consider implementing server-side compression if needed

### 4. Avatar Metadata

Store additional metadata:
- `description` field for avatar notes
- `created_by_user_id` to track who uploaded
- `tags` for categorization (e.g., "formal", "casual")

### 5. Bulk Operations

Add bulk management features:
- Upload multiple avatars at once
- Batch delete unused avatars
- Export all avatars for a project

### 6. Integration with Chat

Plan for future chat integration:
- Add `avatar_id` field to chat sessions
- Allow selecting avatar when starting chat
- Display avatar in chat UI

### 7. Storage Cleanup

Implement automated cleanup:
- Background job to remove orphaned files
- Archive old/inactive avatars after 90 days
- Provide admin tools for storage management

### 8. Validation Enhancement

Add GAB file format validation:
- Verify file structure/headers
- Check for required GAB metadata
- Validate compatibility with your avatar system

### 9. Preview Functionality

Add avatar preview capabilities:
- Extract thumbnail from GAB file
- Display preview before upload
- Show avatar preview in project list

### 10. Audit Trail

Track avatar changes:
- Log all uploads, deletions, activations
- Store in audit table for compliance
- Display change history in admin panel

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Create Avatar model and migration
- Implement storage service
- Add basic API endpoints

### Phase 2: Customer Upload (Week 2)
- Create upload UI component
- Add to project detail page
- Implement client-side validation

### Phase 3: Management Features (Week 3)
- Add delete functionality
- Implement download endpoint
- Add avatar listing

### Phase 4: Polish & Optimization (Week 4)
- Add file size validation
- Implement active avatar logic
- Add error handling and user feedback

## Testing Checklist

- [ ] Upload GAB file successfully
- [ ] Verify file saved with UUID filename
- [ ] Confirm database record created
- [ ] Test file size validation
- [ ] Test file extension validation
- [ ] Verify customer can only upload to own projects
- [ ] Test download functionality
- [ ] Test delete functionality
- [ ] Verify cascade delete when project deleted
- [ ] Test concurrent uploads
- [ ] Verify storage cleanup on deletion

## Future Enhancements

1. **Avatar Library:** Pre-built avatar gallery for customers
2. **Avatar Editor:** In-app GAB file editor
3. **Voice Integration:** Link avatars to voice settings
4. **Analytics:** Track avatar usage and performance
5. **Sharing:** Allow sharing avatars between projects (same customer)
