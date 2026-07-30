from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from neo4j import Session

from app.db.neo4j_driver import get_db
from app.models.polity import PolityResponse
from app.services import polity_service

router = APIRouter(prefix="/polities", tags=["polities"])


@router.get("/for-location", response_model=PolityResponse)
def get_polity_for_location(
    location_id: str,
    target_date: date_type = Query(alias="date"),
    session: Session = Depends(get_db),
) -> PolityResponse:
    polity = polity_service.get_polity_for_location(session, location_id, target_date)
    if polity is None:
        raise HTTPException(
            status_code=404, detail="No polity found for this location/date"
        )
    return polity
