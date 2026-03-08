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
    if current_user.couple_id:
        raise HTTPException(status_code=400, detail="User is already in a couple")

    # The creator becomes user1; user2_id stays NULL until a partner accepts the invite.
    couple = Couple(name=payload.name, user1_id=current_user.id)
    db.add(couple)
    db.flush()  # get the couple.id without a full commit

    current_user.couple_id = couple.id
    db.commit()
    db.refresh(couple)

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

    couple = db.query(Couple).filter(Couple.id == current_user.couple_id).first()

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
    couple = db.query(Couple).filter(Couple.id == couple_id).first()

    if not couple:
        raise HTTPException(status_code=404, detail="Couple not found")

    if current_user.couple_id != couple.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    return couple

