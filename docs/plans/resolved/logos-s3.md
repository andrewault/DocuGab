# S3 Storage for Project Logos

This plan details the implementation of storing project logos in an AWS S3 bucket (`docutok-logos`). Currently, logos are stored locally or not fully handled for S3. This change will ensure logos are uploaded to S3 when the storage backend is configured for it.

## Overview

-   **Bucket Name**: `docutok-logos`
-   **File Naming**: `{project_uuid}.{ext}` (e.g., `123e4567-e89b-12d3-a456-426614174000.png`)
-   **Trigger**: Upload from `admin/projects/:project_id/edit?tab=basic`
-   **Access**: Publicly readable or Presigned URLs (depending on requirements, but often logos are public. We will follow the existing pattern for avatars which uses presigned URLs or public access).

## 1. Configuration Changes

We need to add the new bucket configuration to the application settings.

### [MODIFY] `backend/app/core/config.py`

Add `s3_logos_bucket` to the `Settings` class.

```python
class Settings(BaseSettings):
    # ... existing config ...
    
    # Storage Configuration
    storage_backend: str = "local"  # local or s3
    s3_project_documents_bucket: str = "dokutok-project-documents"
    s3_avatars_bucket: str = "docutok-avatars"
    s3_logos_bucket: str = "docutok-logos"  # <--- NEW
```

## 2. Storage Service Updates

Update `storage.py` to handle S3 uploads for logos.

### [MODIFY] `backend/app/services/storage.py`

Update `save_logo_file` to support S3.

-   If `settings.storage_backend == "s3"`:
    -   Upload file to `s3_logos_bucket`.
    -   Key should be `logos/{project_uuid}.png`.
    -   Set `ContentType` to `image/png`.
-   If `local`:
    -   Keep existing behavior (save to `uploads/logos`).

Update `get_logo_url` (or helper) to return the correct URL.
-   If `s3`: Generate presigned URL or public URL.
-   If `local`: Return `/api/v1/admin/projects/{uuid}/logo` (or similar serving path).

## 3. API Route Updates

Refine the upload endpoint to use the updated storage service.

### [MODIFY] `backend/app/api/routes/admin_routes/projects.py`

-   The `upload_project_logo` endpoint already calls `save_logo_file`.
-   Ensure it passes the necessary arguments.
-   Update `get_project_logo` to redirect to S3 URL if using S3, or serve file if local.
    -   *Correction*: If we return a URL in the JSON response for the frontend to render, we might not need `get_project_logo` to serve the file content directly if it's on S3. However, if the frontend expects `<img src="/api/admin/projects/.../logo">`, then `get_project_logo` should assume the role of a proxy or redirector.
    -   *Recommendation*: Return the full URL in `ProjectResponse`. The `logo` field in `Project` model already stores a string (URL or path). We should store the S3 URL or a path that the frontend can resolve.

## Recommendations

1.  **Presigned URLs vs Public**: If logos are meant to be public (visible on login pages, etc. without auth), the S3 bucket should have a public read policy for the `logos/` prefix, or we use CloudFront. Generating presigned URLs for every view of a logo can be inefficient and prevents caching. 
    -   **Recommendation**: Use **Public Read** access for the `docutok-logos` bucket items, so they can be cached by browsers.

2.  **Caching**: S3 objects should be uploaded with `Cache-Control` headers (e.g., `max-age=31536000`) since filenames are UUID-based and immutable (or we strictly overwrite).
    -   *Wait*, if the valid filename determines the content (e.g. `logo.png` is always the logo), and we overwrite it, browser caching might hide updates. 
    -   *Refinement*: Add a query param timestamp `?v=timestamp` in the frontend when properly rendering to bust cache if we overwrite the same key. All logos are named `{uuid}.png` so they WILL be overwritten on update.

3.  **Image Optimization**: Consider resizing or optimizing the logo before upload (using `Pillow`) to avoid serving 5MB raw images.

## Questions

1.  Is the `docutok-logos` bucket already created?
2.  Should the logos be publicly accessible (for public-facing project pages)?
3.  Do we need to migrate existing local logos to S3?

## Verification Plan

### Automated Tests
-   Mock `boto3` in unit tests to verify `save_logo_file` calls `put_object` with correct bucket and key.

### Manual Verification
1.  **Configure environment**: Set `STORAGE_BACKEND=s3` and AWS credentials.
2.  **Upload Logo**: Go to Admin > Projects > [Select Project] > Edit > Basic Info. Upload a new logo.
3.  **Verify S3**: Check AWS Console (S3) to see if `{uuid}.png` appears in `docutok-logos`.
4.  **Verify UI**: Ensure the logo displays correctly in the Project Edit and Detail pages.
