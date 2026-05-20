from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "qwen3:8b"
    ollama_num_ctx: int = 16384
    cors_origins: str = "http://localhost"
    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "local_ai_docs"


settings = Settings()
