from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from neo4j import Session

from app.db.neo4j_driver import get_db
from app.models.event import EventResponse
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_events(
    start_date: date,
    end_date: date,
    session: Session = Depends(get_db),
) -> list[EventResponse]:
    return event_service.get_events_in_range(session, start_date, end_date)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, session: Session = Depends(get_db)) -> EventResponse:
    event = event_service.get_event_by_id(session, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")
    return event


@router.get("/{event_id}/concurrent", response_model=list[EventResponse])
def list_concurrent_events(
    event_id: str, session: Session = Depends(get_db)
) -> list[EventResponse]:
    return event_service.get_concurrent_events(session, event_id)
