from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Defaults below are placeholders for import-safety only (so the app and
    # test suite never require a real .env file to exist). The neo4j driver
    # connects lazily, so these are never dialed unless get_driver() is
    # actually used without dependency overrides. Real Aura values must be
    # supplied via .env for `uvicorn` to talk to a real database.
    neo4j_uri: str = "neo4j://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password"
    # Kept as a plain comma-separated string (not list[str]): pydantic-settings
    # tries to JSON-decode list-typed env values before any validator runs,
    # which breaks a simple "a,b,c" .env value. Parsed via the property below.
    allowed_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
