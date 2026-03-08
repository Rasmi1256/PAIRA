from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.models.journal import JournalEntry, JournalAttachment
from app.models.user import User
from app.schemas.journal import (
    JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse,
    JournalAttachmentCreate, JournalAttachmentResponse
)
from app.api.deps import get_current_user
from app.core.gcs import upload_file_to_gcs

router = APIRouter(
    prefix="/journal",
    tags=["Journal"],
)


# =========================
# Get Journal Entries
# =========================

@router.get("", response_model=List[JournalEntryResponse])
def get_journal_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all journal entries for the current user's couple.
    """
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.couple_id == current_user.couple_id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )
    return entries


# =========================
# Create Journal Entry
# =========================

@router.post("", response_model=JournalEntryResponse)
def create_journal_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new journal entry for the couple.
    """
    db_entry = JournalEntry(
        content=entry.content,
        mood=entry.mood,
        is_private=entry.is_private,
        couple_id=current_user.couple_id,
        author_id=current_user.id,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


# =========================
# Update Journal Entry
# =========================

@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: UUID,
    entry_update: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a journal entry. Only the author can update.
    """
    db_entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.id == entry_id,
            JournalEntry.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Only allow updates by the author
    if db_entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this entry")

    update_data = entry_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_entry, field, value)

    db.commit()
    db.refresh(db_entry)
    return db_entry


# =========================
# Delete Journal Entry
# =========================

@router.delete("/{entry_id}")
def delete_journal_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a journal entry. Only the author can delete.
    """
    db_entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.id == entry_id,
            JournalEntry.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Only allow deletion by the author
    if db_entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this entry")

    db.delete(db_entry)
    db.commit()

    return {"message": "Journal entry deleted successfully"}


# =========================
# Add Attachment to Journal Entry
# =========================

@router.post("/{entry_id}/attachments", response_model=JournalAttachmentResponse)
def add_journal_attachment(
    entry_id: UUID,
    file: UploadFile = File(...),
    attachment_type: str = "file",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add an attachment to a journal entry.
    """
    # Verify the entry exists and belongs to the couple
    db_entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.id == entry_id,
            JournalEntry.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Only allow attachments by the author
    if db_entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add attachments to this entry")

    # Upload file to GCS
    try:
        file_path = upload_file_to_gcs(file, f"journal/{entry_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # Create attachment record
    db_attachment = JournalAttachment(
        journal_id=entry_id,
        type=attachment_type,
        file_path=file_path,
    )
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


# =========================
# Remove Attachment from Journal Entry
# =========================

@router.delete("/{entry_id}/attachments/{attachment_id}")
def remove_journal_attachment(
    entry_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove an attachment from a journal entry.
    """
    # Verify the entry exists and belongs to the couple
    db_entry = (
        db.query(JournalEntry)
        .filter(
            JournalEntry.id == entry_id,
            JournalEntry.couple_id == current_user.couple_id
        )
        .first()
    )

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Find the attachment
    db_attachment = (
        db.query(JournalAttachment)
        .filter(
            JournalAttachment.id == attachment_id,
            JournalAttachment.journal_id == entry_id
        )
        .first()
    )

    if not db_attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only allow removal by the author
    if db_entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove attachments from this entry")

    db.delete(db_attachment)
    db.commit()

    return {"message": "Attachment removed successfully"}
