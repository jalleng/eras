from pydantic import BaseModel


class PolityResponse(BaseModel):
    id: str
    name: str
    # No boundary geometry field yet — that's Phase 5 (ingestion/boundaries_loader.py).
