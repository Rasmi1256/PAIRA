from pydantic import BaseModel, ConfigDict

class CoupleCreate(BaseModel):
    name: str | None = None

class CoupleOut(BaseModel):
    id: int
    name: str | None = None
    user1_id: int | None = None
    user2_id: int | None = None

    model_config = ConfigDict(from_attributes=True)
