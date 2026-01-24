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
    api_host: str = "0.0.0.0"
    backend_port: int = 8000
    debug: bool = False

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Ollama Configuration
    ollama_base_url: str = "http://localhost:11434"
    embedding_model: str = "nomic-embed-text"
    llm_model: str = "llama3.2"
    chunk_size: int = 500
    chunk_overlap: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
