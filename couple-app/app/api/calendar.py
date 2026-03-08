from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.db.session import get_db
from app.models.calendar import CalendarEvent
from app.models.couple import Couple
from app.models.user import User
from app.schemas.calendar import (
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse,
    CoupleAnniversaryUpdate
)
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"],
)


# =========================
# Get Calendar Events
# =========================

@router.get("", response_model=List[CalendarEventResponse])
def get_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all calendar events for the current user's couple.
    """
    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.couple_id == current_user.couple_id)
        .order_by(CalendarEvent.event_date)
        .all()
    )
    return events


# =========================
# Create Calendar Event
# =========================

@router.post("", response_model=CalendarEventResponse)
def create_calendar_event(
    event: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new calendar event for the couple.
    """
    db_event = CalendarEvent(
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        event_type=event.event_type,
        couple_id=current_user.couple_id,
        created_by=current_user.id,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


# =========================
# Update Calendar Event
# =========================

@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: int,
    event_update: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a calendar event. Only the creator or couple members can update.
    """
    db_event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    # Only allow updates by the creator
    if db_event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this event")

    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)

    db.commit()
    db.refresh(db_event)
    return db_event


# =========================
# Delete Calendar Event
# =========================

@router.delete("/{event_id}")
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a calendar event. Only the creator can delete.
    """
    db_event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    # Only allow deletion by the creator
    if db_event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")

    db.delete(db_event)
    db.commit()

    return {"message": "Calendar event deleted successfully"}


# =========================
# Get Couple Anniversary
# =========================

@router.get("/anniversary")
def get_couple_anniversary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the couple's anniversary date.
    """
    couple = (
        db.query(Couple)
        .filter(Couple.id == current_user.couple_id)
        .first()
    )

    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    return {"anniversary_date": couple.anniversary_date}


# =========================
# Update Couple Anniversary
# =========================

@router.put("/anniversary")
def update_couple_anniversary(
    anniversary_update: CoupleAnniversaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the couple's anniversary date.
    """
    couple = (
        db.query(Couple)
        .filter(Couple.id == current_user.couple_id)
        .first()
    )

    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    couple.anniversary_date = anniversary_update.anniversary_date
    db.commit()

    return {"message": "Anniversary date updated successfully", "anniversary_date": couple.anniversary_date}
