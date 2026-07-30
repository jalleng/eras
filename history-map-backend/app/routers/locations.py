from fastapi import APIRouter, Depends, HTTPException
from neo4j import Session

from app.db.neo4j_driver import get_db
from app.models.location import LocationResponse
from app.services import location_service

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/nearest", response_model=LocationResponse)
def get_nearest_location(
    lat: float, lon: float, session: Session = Depends(get_db)
) -> LocationResponse:
    location = location_service.get_nearest_location(session, lat, lon)
    if location is None:
        raise HTTPException(status_code=404, detail="No locations found")
    return location
