from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class RaceResponse(BaseModel):
    id: UUID
    entry_fee: float
    max_horses: int
    min_horses: int
    status: str
    start_time: datetime
    level_requirement: int
    prize_pool_sol: float = 0.0
    created_at: datetime
    registered_horses: int = 0

    class Config:
        from_attributes = True

class RaceJoin(BaseModel):
    horse_id: UUID
    transaction_signature: Optional[str] = None

    class Config:
        from_attributes = True

class RaceResultResponse(BaseModel):
    id: UUID
    race_id: UUID
    horse_id: UUID
    horse_name: Optional[str] = None
    owner_name: Optional[str] = None
    color: Optional[str] = None
    finish_position: Optional[int]
    finish_time_ms: Optional[int]
    reward_amount: float
    created_at: datetime
    race_segments: Optional[str] = None
    goodluck_used: bool = False

    class Config:
        from_attributes = True