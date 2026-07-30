from pydantic import BaseModel


class LocationResponse(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    region: str
