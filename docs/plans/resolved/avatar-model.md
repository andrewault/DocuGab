# Avatar Model Implementation Plan

## Overview

Implement an `Avatar` model to manage avatar assets for projects. Avatars will be stored in S3 and referenced by projects via a foreign key relationship.

## Database Schema

### New `avatars` Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| uuid | UUID | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| customer_id | INTEGER | FK → customers.id, NULLABLE |
| thumbnail_url | VARCHAR(512) | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

**Constraints:**
- Only one Avatar with the name "Default" can exist (enforced via unique partial index where `name = 'Default'`)
- Default avatar has `customer_id = NULL` (global)
- Customer-scoped avatars have `customer_id` set

### Project Model Changes

Add `avatar_id` foreign key to `projects` table:
- `avatar_id` → references `avatars.id`
- Nullable (defaults to "Default" avatar)

## S3 Storage

- **Bucket**: `docutok-avatars`
- **Avatar key format**: `{avatar_uuid}.glb` or `{avatar_uuid}.fbx`
- **Thumbnail key format**: `{avatar_uuid}_thumb.png`
- **Access**: Private, served via signed URLs or proxied through backend

## Default Avatar

- A "Default" avatar record will be seeded in the database
- `customer_id = NULL` (globally available)
- File stored in S3 at `default.glb`
- New projects default to this avatar

## Avatar Scoping

- **Customer-scoped avatars**: Avatars uploaded by a customer are only visible to that customer
- **Default avatar**: Globally available to all customers
- Query logic: `WHERE customer_id = :current_customer_id OR customer_id IS NULL`

## Frontend Changes

### Edit Project Page (`/admin/projects/:id/edit?tab=voice`)

1. **Upload Avatar Button**
   - Displays "Upload Avatar" modal on click

2. **Upload Avatar Modal**
   - Drag & drop zone for file upload
   - File type validation: `.glb` and `.fbx` only
   - **Size limit: 50MB maximum**
   - Progress indicator during upload
   - Success/error feedback

3. **Avatar Selection**
   - Dropdown or grid showing available avatars
   - Thumbnail preview for each avatar
   - Shows customer avatars + Default avatar

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/avatars` | List avatars (customer + global) |
| POST | `/api/v1/avatars/upload` | Upload new avatar |
| DELETE | `/api/v1/avatars/{uuid}` | Delete avatar |

## Implementation Requirements

### File Validation
Validate GLB/FBX file structure on upload to ensure they're valid 3D models, not just files with the correct extension. Use a library like `pygltflib` for GLB validation.

### Thumbnail Generation
Generate thumbnail previews of avatars for the selection UI. This could be done with a headless Three.js renderer on upload, or a server-side solution using Blender in headless mode.

### Size Limits
Set a file size limit of **50MB** to prevent overly complex models that may cause performance issues.

### Fallback Handling
If an avatar fails to load on the frontend, gracefully fall back to the Default avatar rather than showing an error.

## Migration Strategy

Create a database migration that:

1. Creates the `avatars` table
2. Seeds the "Default" avatar record
3. Adds `avatar_id` column to `projects` table
4. Migrates existing `avatar` string values to reference the new table
5. Removes the old `avatar` string column from `projects`
