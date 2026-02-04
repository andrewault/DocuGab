# S3 Database Backups Plan

## Goal
Implement an automated, reliable backup system for the DocuTok PostgreSQL database (RDS) that stores artifacts in a secured AWS S3 bucket. The system must run within the Kubernetes cluster.

## Architecture
We will utilize a **Kubernetes CronJob** to schedule and execute the backup process.

**Data Flow:**
1.  **Trigger**: CronJob starts a pod (e.g., daily at 02:00 UTC).
2.  **Extraction**: Pod connects to RDS using `pg_dump`.
3.  **Compression**: Stream is piped through `gzip`.
4.  **Upload**: Stream is piped (or file uploaded) to AWS S3 using `aws s3 cp`.
5.  **Cleanup**: Ephemeral pod terminates.

## Requirements

### 1. AWS Resources
*   **S3 Bucket**: `docutok-db-backups` (already exists or needs creation).
    *   **Versioning**: Enabled (recommended).
    *   **Encryption**: ASE-256 (default).
    *   **Lifecycle Policy**: Delete objects after 30 days.
*   **IAM Policy**:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["s3:PutObject", "s3:ListBucket"],
                "Resource": [
                    "arn:aws:s3:::docutok-db-backups",
                    "arn:aws:s3:::docutok-db-backups/*"
                ]
            }
        ]
    }
    ```

### 2. Kubernetes Configuration
*   **Secrets**:
    *   `POSTGRES_PASSWORD` (Existing: `docutok-secrets`)
    *   `POSTGRES_PASSWORD` (Existing: `docutok-secrets`)
    *   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (Need to add to `docutok-secrets` or use IRSA).

### 3. Frontend / UI (Admin Check)
*   **Environment Detection**: The frontend needs to know if it's running in AWS/Production to toggle the UI.
    *   Use `VITE_DEPLOYMENT_ENV` or similar flag.
*   **Database Page (`admin/database`)**:
    *   **Hide Actions**: Hide manual "Backup Now" / "Restore" buttons that rely on local filesystem.
    *   **Show S3 Only**: Display a list of S3 backups (fetched via a new API endpoint).
    *   **Restoration Info**: Add a readonly section explaining how to restore from S3 manually (CLI command).

## Implementation Steps

1.  **Create Backup Script**: `scripts/database/backup_to_s3.sh`
    *   Must handle `pg_dump -h $DB_HOST ... | gzip | aws s3 cp - s3://$BUCKET/backup.sql.gz`.
2.  **Docker Image**:
    *   Ideally use a lightweight image containing `postgresql-client` and `aws-cli`.
    *   Alternatively, simple `alpine` image installing these tools at runtime (slower, easier).
3.  **Kubernetes CronJob**:
    *   Define `k8s/backup-cronjob.yaml`.
    *   Schedule: `0 2 * * *` (Daily at 2 AM).
4.  **Verification**:
    *   Manual trigger: `kubectl create job --from=cronjob/db-backup manual-backup`.

## Recommendations

### 1. Retention Policy (S3 Lifecycle)
### 1. Retention Policy (S3 Lifecycle) - **CRITICAL**
Configure the S3 bucket with a Lifecycle Rule to **expire objects after 30 days**. This is mandatory to prevent storage costs from growing locally indefinitely.

### 2. Stream vs File
Pipe the output directly to S3 (`pg_dump | gzip | aws s3 cp - ...`) to avoid disk space issues on the backup pod. The backup pod might have limited ephemeral storage.

### 3. Monitoring
Since cron jobs failing can be silent:
*   **Simple**: Check `kubectl get jobs` regularly.
*   **Better**: Add a "health check" pixel or webhook call (e.g., to Healthchecks.io or internal monitoring) at the end of the script: `curl -m 10 https://hc-ping.com/...`.

### 4. Restore Drill
A backup is useless without a restore plan. Document the restore process:
```bash
aws s3 cp s3://docutok-db-backups/latest.sql.gz - | gunzip | psql -h $DB_HOST ...
```
