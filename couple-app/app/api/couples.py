from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.couple import Couple
from app.schemas.couple import CoupleCreate, CoupleOut
from app.models.user import User

router = APIRouter(prefix="/couples", tags=["couples"])


@router.post("/", response_model=CoupleOut)
def create_couple(
    payload: CoupleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    couple = Couple(name=payload.name)
    db.add(couple)
    db.commit()
    db.refresh(couple)

    current_user.couple_id = couple.id
    db.add(current_user)
    db.commit()

    return couple


# -------------------------
# PUT /me BEFORE /{id}
# -------------------------
@router.get("/me", response_model=CoupleOut)
def get_my_couple(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.couple_id:
        raise HTTPException(status_code=404, detail="User is not in a couple")

    couple = db.query(Couple).get(current_user.couple_id)

    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    return couple


# -------------------------
# Force integer path param
# -------------------------
@router.get("/{couple_id}", response_model=CoupleOut)
def get_couple(
    couple_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    couple = db.query(Couple).get(couple_id)

    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    if current_user.couple_id != couple.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    return couple

