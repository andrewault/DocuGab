# S3 Project Documents Implementation Plan

## Objective
Implement a hybrid storage backend for DocuGab project documents:
1.  **Production**: Store documents in the S3 bucket `dokutok-project-documents`.
2.  **Local Development**: Continue using the local filesystem (`/app/uploads`).

This ensures production data persistence (solving the ephemeral pod storage issue) while maintaining a simple local developer experience.

## Infrastructure Configuration

### S3 Bucket
*   **Bucket Name**: `dokutok-project-documents`
*   **Region**: `us-west-2` (Consistent with existing infrastructure)

### Bucket Policy
The bucket should be private by default. Access will be granted only to the specific IAM user (`docutok-backup-bot`) or Role used by the backend service.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowBackendAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::932380677908:user/docutok-backup-bot"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::dokutok-project-documents",
                "arn:aws:s3:::dokutok-project-documents/*"
            ]
        }
    ]
}
```

## Application Implementation Refactor

### 1. Configuration (`app/core/config.py`)
Add new environment variables to control storage behavior:

*   `STORAGE_BACKEND`: Enum [`local`, `s3`] (Default: `local`)
*   `S3_PROJECT_DOCUMENTS_BUCKET`: `dokutok-project-documents`
*   `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` (Already exist for Bedrock, reuse or separate).

### 2. Storage Service Refactor (`app/services/storage.py`)
Refactor the current module-level functions into a unified `StorageService` interface with two implementations:

#### `LocalStorageService` (Current Implementation)
*   Keeps existing logic using `pathlib`.
*   Used when `STORAGE_BACKEND=local`.

#### `S3StorageService` (New Implementation)
*   **Upload**: Uses `boto3` to upload files to S3.
    *   Key Format: `documents/{document_id}/{filename}`
*   **Retrieve**:
    *   *Option A (Proxy)*: Backend downloads from S3 and streams to client (easiest migration).
    *   *Option B (Presigned URLs)*: Backend generates a temp URL for frontend to fetch directly (better scaling).
    *   *Decision*: Start with **Option A (Proxy)** to minimize frontend changes, as the current API serves files directly.
*   **Delete**: Deletes objects from S3.

## Recommendations

### Security
1.  **IAM Roles for Service Accounts (IRSA)**: Instead of long-lived IAM User credentials (`docutok-backup-bot`), recommended to switch to EKS IRSA. This allows the Pod to assume an IAM Role securely without managing secrets.
2.  **Encryption**: Enable Server-Side Encryption (SSE-S3) on the bucket default settings.

### Operations
3.  **Lifecycle Policies**: Implement an S3 Lifecycle Rule to transition older documents to Standard-IA (Infrequent Access) after 30 days to save costs, given that RAG access patterns often favor recent documents.
4.  **Versioning**: Enable S3 Bucket Versioning to prevent accidental deletions or overwrites, especially if "Update Document" features are added later.

### Migration
5.  **Hybrid Transition**: Since the current prod docs are ephemeral/lost on restart, no data migration is needed for existing valid files. We can start fresh with S3.
