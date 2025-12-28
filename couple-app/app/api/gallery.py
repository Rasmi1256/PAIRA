from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import boto3
import json

from app.config import settings
from app.db.session import get_db
from app.models.media import Media
from app.models.gallery import Album, Tag
from app.models.user import User
from app.schemas.gallery import (
    AlbumCreate, AlbumUpdate, AlbumResponse,
    TagCreate, TagUpdate, TagResponse,
    MediaUpdate, MediaResponse,
    GalleryItem, GalleryFilterRequest,
    FavoriteToggleRequest, StarToggleRequest, BulkTagRequest
)
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/gallery",
    tags=["Gallery"],
)


# =========================
# Helpers
# =========================

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


# =========================
# Get Gallery (SIGNED URLS)
# =========================

@router.get("")
def get_gallery(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns gallery items with SIGNED S3 URLs so private images/videos render.
    """

    s3 = get_s3_client()

    media_items = (
        db.query(Media)
        .filter(Media.couple_id == current_user.couple_id)
        .order_by(Media.created_at.desc())
        .all()
    )

    results = []

    for item in media_items:
        signed_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_S3_BUCKET_NAME,
                "Key": item.key,
            },
            ExpiresIn=3600,  # 1 hour
        )

        results.append({
            "id": item.id,
            "url": signed_url,  # ✅ SIGNED URL (THIS FIXES RENDERING)
            "type": "image" if item.file_type.startswith("image") else "video",
            "createdAt": item.created_at,
            "is_favorite": item.is_favorite,
            "is_starred": item.is_starred,
        })

    return results


# =========================
# Delete Gallery Item
# =========================

@router.delete("/{media_id}")
def delete_gallery_item(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a gallery item: removes from S3 and database.
    Only the owner can delete their own media.
    """

    # Find the media item
    media_item = (
        db.query(Media)
        .filter(Media.id == media_id, Media.couple_id == current_user.couple_id)
        .first()
    )

    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found")

    s3 = get_s3_client()

    try:
        # Delete from S3
        s3.delete_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=media_item.key,
        )
    except Exception as e:
        # Log the error but continue to delete from DB
        print(f"Failed to delete from S3: {e}")

    # Delete from database
    db.delete(media_item)
    db.commit()

    return {"message": "Media item deleted successfully"}


# =========================
# Toggle Favorite
# =========================

@router.post("/media/{media_id}/favorite")
def toggle_favorite(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle the favorite status of a media item.
    Only the owner can toggle their own media.
    """

    media_item = (
        db.query(Media)
        .filter(Media.id == media_id, Media.couple_id == current_user.couple_id)
        .first()
    )

    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found")

    # Toggle the favorite status
    media_item.is_favorite = not media_item.is_favorite
    db.commit()

    return {"message": "Favorite status toggled successfully", "is_favorite": media_item.is_favorite}


# =========================
# Toggle Star
# =========================

@router.post("/media/{media_id}/star")
def toggle_star(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle the star status of a media item.
    Only the owner can toggle their own media.
    """

    media_item = (
        db.query(Media)
        .filter(Media.id == media_id, Media.couple_id == current_user.couple_id)
        .first()
    )

    if not media_item:
        raise HTTPException(status_code=404, detail="Media item not found")

    # Toggle the star status
    media_item.is_starred = not media_item.is_starred
    db.commit()

    return {"message": "Star status toggled successfully", "is_starred": media_item.is_starred}
