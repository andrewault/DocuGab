"""
Database backup management endpoints.
"""

import os
import subprocess
from datetime import datetime
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_superadmin_user
from app.models import User

router = APIRouter()

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
BACKUP_DIR = PROJECT_ROOT / "dbbackups"
BACKUP_SCRIPT = PROJECT_ROOT / "scripts" / "database" / "backup.sh"

# AWS Configuration
S3_BUCKET = os.getenv("AWS_S3_BACKUP_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")


def get_s3_client():
    """Get S3 client if configured."""
    if not S3_BUCKET:
        return None
    try:
        return boto3.client("s3", region_name=AWS_REGION)
    except Exception as e:
        print(f"Failed to create S3 client: {e}")
        return None


@router.get("/config")
async def get_backup_config(
    current_user: User = Depends(get_superadmin_user),
):
    """
    Get backup configuration status.
    Requires superadmin role.
    """
    return {
        "provider": "s3" if S3_BUCKET else "local",
        "bucket": S3_BUCKET,
        "region": AWS_REGION,
    }


@router.post("/vacuum")
async def vacuum_database(
    current_user: User = Depends(get_superadmin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run VACUUM on the database to reclaim storage and optimize performance.
    Requires superadmin role.
    """
    try:
        # VACUUM cannot run inside a transaction - use psql directly
        db_host = os.getenv("POSTGRES_HOST", "db")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("POSTGRES_DB", "docutok")
        db_user = os.getenv("POSTGRES_USER", "docutok")
        db_password = os.getenv("POSTGRES_PASSWORD", "docutok_secret")

        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        # Check if psql is available
        try:
            subprocess.run(["psql", "--version"], check=True, capture_output=True)
        except Exception:
            # If running in a minimal container without psql, we might skip this
            # But usually the backend image has client tools or we rely on them.
            # If we moved to a light image without psql, this would fail.
            pass

        result = subprocess.run(
            [
                "psql",
                "-h",
                db_host,
                "-p",
                db_port,
                "-U",
                db_user,
                "-d",
                db_name,
                "-c",
                "VACUUM ANALYZE;",
            ],
            env=env,
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=500, detail=f"VACUUM failed: {result.stderr}"
            )

        return {
            "message": "Database vacuumed successfully",
            "details": "VACUUM ANALYZE completed - storage reclaimed and statistics updated",
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="VACUUM timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VACUUM failed: {str(e)}")


@router.post("/backup")
async def create_backup(
    current_user: User = Depends(get_superadmin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new database backup.
    If S3 is configured, this endpoint might trigger a job (not implemented here) or fail.
    For now, we keep local behavior or disable it if S3 is active.
    """
    if S3_BUCKET:
        # In AWS, we rely on CronJobs. Manual triggering via this API is complex
        # without k8s API access from the pod.
        raise HTTPException(
            status_code=400,
            detail="Manual backups via API not supported in S3 mode. Use Kubernetes CronJob.",
        )

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(exist_ok=True)

    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_filename = f"docutok-backup-{timestamp}.sql.gz"
    backup_path = BACKUP_DIR / backup_filename

    try:
        # Get database connection details from environment
        db_host = os.getenv("POSTGRES_HOST", "db")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("POSTGRES_DB", "docutok")
        db_user = os.getenv("POSTGRES_USER", "docutok")
        db_password = os.getenv("POSTGRES_PASSWORD", "docutok_secret")

        # Set PGPASSWORD environment variable for pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        # Run pg_dump and compress with gzip
        pg_dump_cmd = [
            "pg_dump",
            "-h",
            db_host,
            "-p",
            db_port,
            "-U",
            db_user,
            "-d",
            db_name,
            "--no-owner",
            "--no-acl",
        ]

        gzip_cmd = ["gzip", "-c"]

        # Run pg_dump | gzip > backup_file
        with open(backup_path, "wb") as f:
            pg_dump = subprocess.Popen(
                pg_dump_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
            )
            gzip_proc = subprocess.Popen(
                gzip_cmd,
                stdin=pg_dump.stdout,
                stdout=f,
                stderr=subprocess.PIPE,
            )
            pg_dump.stdout.close()  # Allow pg_dump to receive SIGPIPE

            # Wait for both processes to complete
            gzip_stderr = gzip_proc.communicate()[1]
            pg_dump_stderr = pg_dump.communicate()[1]

            if pg_dump.returncode != 0:
                # Clean up failed backup file
                if backup_path.exists():
                    backup_path.unlink()
                raise HTTPException(
                    status_code=500, detail=f"pg_dump failed: {pg_dump_stderr.decode()}"
                )

            if gzip_proc.returncode != 0:
                # Clean up failed backup file
                if backup_path.exists():
                    backup_path.unlink()
                raise HTTPException(
                    status_code=500, detail=f"gzip failed: {gzip_stderr.decode()}"
                )

        return {
            "message": "Backup created successfully",
            "filename": backup_filename,
            "size": backup_path.stat().st_size,
        }

    except subprocess.TimeoutExpired:
        if backup_path.exists():
            backup_path.unlink()
        raise HTTPException(status_code=500, detail="Backup timeout")
    except Exception as e:
        if backup_path.exists():
            backup_path.unlink()
        raise HTTPException(status_code=500, detail=f"Backup error: {str(e)}")


@router.get("/backups")
async def list_backups(
    current_user: User = Depends(get_superadmin_user),
):
    """
    List all database backups.
    Requires superadmin role.
    """
    backups = []

    if S3_BUCKET:
        s3 = get_s3_client()
        if not s3:
            raise HTTPException(
                status_code=500, detail="S3 client configuration failed"
            )

        try:
            response = s3.list_objects_v2(Bucket=S3_BUCKET)
            if "Contents" in response:
                for obj in response["Contents"]:
                    # Filter for our backup files if needed, but bucket might be dedicated
                    if obj["Key"].endswith(".sql.gz"):
                        backups.append(
                            {
                                "filename": obj["Key"],
                                "size": obj["Size"],
                                "created_at": obj["LastModified"].isoformat(),
                                "source": "s3",
                            }
                        )
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 list failed: {str(e)}")
    else:
        # Local listing
        # Ensure backup directory exists
        BACKUP_DIR.mkdir(exist_ok=True)

        for backup_file in BACKUP_DIR.glob("docutok-backup-*.sql.gz"):
            stat = backup_file.stat()
            backups.append(
                {
                    "filename": backup_file.name,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "source": "local",
                }
            )

    # Sort by created_at descending (newest first)
    # Using ISO format string sort works well
    backups.sort(key=lambda x: x["created_at"], reverse=True)

    return backups


@router.get("/backups/{filename}")
async def download_backup(
    filename: str,
    current_user: User = Depends(get_superadmin_user),
):
    """
    Download a database backup file.
    Requires superadmin role.
    """

    if S3_BUCKET:
        s3 = get_s3_client()
        if not s3:
            raise HTTPException(
                status_code=500, detail="S3 client configuration failed"
            )

        try:
            # Generate a presigned URL? Or stream it through backend?
            # Streaming is safer for auth if we don't want to expose presigned URLs to frontend directly
            # or if bucket is private.
            # However, streaming large files via FastAPI can be memory intensive if not careful.
            # But Boto3 + StreamingResponse is standard.

            # Verify file exists first
            try:
                s3.head_object(Bucket=S3_BUCKET, Key=filename)
            except ClientError:
                raise HTTPException(status_code=404, detail="Backup not found in S3")

            file_stream = s3.get_object(Bucket=S3_BUCKET, Key=filename)["Body"]

            return StreamingResponse(
                file_stream,
                media_type="application/gzip",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 download failed: {str(e)}")

    else:
        # Local download
        # Security: validate filename to prevent directory traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")

        # Only allow .sql.gz files
        if not filename.endswith(".sql.gz"):
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Only allow files starting with docutok-backup-
        if not filename.startswith("docutok-backup-"):
            raise HTTPException(status_code=400, detail="Invalid backup file")

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup not found")

        return FileResponse(
            path=backup_path,
            filename=filename,
            media_type="application/gzip",
        )


@router.delete("/backups/{filename}")
async def delete_backup(
    filename: str,
    current_user: User = Depends(get_superadmin_user),
):
    """
    Delete a database backup file.
    Requires superadmin role.
    """
    if S3_BUCKET:
        s3 = get_s3_client()
        if not s3:
            raise HTTPException(
                status_code=500, detail="S3 client configuration failed"
            )

        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=filename)
            return {"message": f"Backup {filename} deleted from S3"}
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 delete failed: {str(e)}")

    else:
        # Local delete
        # Security: validate filename to prevent directory traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")

        # Only allow .sql.gz files
        if not filename.endswith(".sql.gz"):
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Only allow files starting with docutok-backup-
        if not filename.startswith("docutok-backup-"):
            raise HTTPException(status_code=400, detail="Invalid backup file")

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup not found")

        try:
            backup_path.unlink()
            return {"message": f"Backup {filename} deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Upload and save a database backup file.
    Requires superadmin role.
    Note: This endpoint only uploads the file, it does not restore it to the database.
    """
    if S3_BUCKET:
        raise HTTPException(
            status_code=400,
            detail="Manual update/restore via API not supported in S3 mode. Use S3 CLI directly.",
        )

    # Validate file extension
    if not file.filename or not file.filename.endswith(".sql.gz"):
        raise HTTPException(status_code=400, detail="Only .sql.gz files are allowed")

    # Validate filename pattern
    if not file.filename.startswith("docutok-backup-"):
        raise HTTPException(
            status_code=400, detail="Backup filename must start with 'docutok-backup-'"
        )

    # Security: sanitize filename
    filename = file.filename.replace("..", "").replace("/", "").replace("\\", "")

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(exist_ok=True)

    backup_path = BACKUP_DIR / filename

    # Check if file already exists
    if backup_path.exists():
        raise HTTPException(status_code=400, detail=f"Backup {filename} already exists")

    try:
        # Save uploaded file
        content = await file.read()
        backup_path.write_bytes(content)

        return {
            "message": f"Backup {filename} uploaded successfully",
            "filename": filename,
            "size": len(content),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
