from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# Load from project root .env
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # API
    api_host: str = "0.0.0.0"  # nosec B104
    backend_port: int = 8007  # Match .env default
    debug: bool = False

    # CORS
    cors_origins: str = "http://localhost:5177"  # Match .env default

    # Bedrock Configuration
    aws_region: str = "us-west-2"
    bedrock_llm_model: str = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    bedrock_embedding_model: str = "amazon.titan-embed-text-v2:0"
    
    # Vector Search Config
    embedding_model: str = "amazon.titan-embed-text-v2:0" # Keep for compatibility if needed, or remove
    chunk_size: int = 500
    chunk_overlap: int = 50

    # Storage Configuration
    storage_backend: str = "local"  # local or s3
    s3_project_documents_bucket: str = "dokutok-project-documents"

    # Context Configuration
    context_window: int = 200000  # Claude 3.5 Haiku context window

    # Auth Configuration
    secret_key: str = "change-me-in-production-min-32-chars"
    access_token_expire_minutes: int = 1800  # 30 hours
    refresh_token_expire_days: int = 7

    # Initial Admin User (optional)
    admin_username: str | None = None
    admin_password: str | None = None

    # Speech Configuration
    tts_voice: str = "en-US-Neural2-F"  # Google Cloud TTS voice

    # Redis Configuration
    redis_url: str = "redis://redis:6379/0"

    # Rate Limiting
    rate_limit_default: str = "100/minute"
    rate_limit_chat: str = "10/minute"
    rate_limit_auth: str = "5/minute"

    # Celery Configuration
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()  # type: ignore
