from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.location import LocationResponse
from app.models.person import PersonResponse


class EventBase(BaseModel):
    """Fields intrinsic to an :Event node itself (not resolved via relationships)."""

    id: str
    title: str
    description: str
    iso_date: date = Field(alias="isoDate")
    latitude: float
    longitude: float

    model_config = ConfigDict(populate_by_name=True)


class EventCreate(EventBase):
    """Ingestion-time shape: raw Event properties plus the relationship
    targets `ingestion/seed.py` wires into the graph. Not an API response
    shape — `region`/`location` aren't authored per-event since they live
    on the :Location/:Region nodes the event links to."""

    source: str
    location_id: str
    person_ids: list[str] = []
    # Groups events that should be connected via CONCURRENT_WITH at seed
    # time (mirrors the frontend's Phase 1 CuratedDateEntry groupings).
    cluster: str


class EventResponse(EventBase):
    """API response shape. The flat fields here (id, title, description,
    isoDate, latitude, longitude, region, location) must match the
    frontend's `HistoricalEvent` type exactly. `location_detail`/`people`
    are additional fields populated only by GET /events/{id}."""

    region: str
    location: str
    location_detail: LocationResponse | None = Field(default=None, alias="locationDetail")
    people: list[PersonResponse] | None = None
