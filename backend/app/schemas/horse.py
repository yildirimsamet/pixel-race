from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional


class HorseStatsBase(BaseModel):

    weight: int
    determination: int
    energy: int
    satiety: int
    bond: int
    fame: int
    instinct: int

    class Config:
        from_attributes = True


class HorseStatsComputed(BaseModel):

    total_races: int
    total_wins: int
    total_earnings: float

    class Config:
        from_attributes = True


class HorseResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    birthdate: date
    age: int
    color: str
    in_race: bool
    created_at: datetime
    nft_mint_address: Optional[str] = None
    nft_metadata_uri: Optional[str] = None
    minted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HorseWithStatsResponse(BaseModel):

    id: UUID
    user_id: UUID
    name: str
    birthdate: date
    age: int
    color: str
    in_race: bool
    created_at: datetime
    nft_mint_address: Optional[str] = None
    nft_metadata_uri: Optional[str] = None
    minted_at: Optional[datetime] = None
    stats: HorseStatsBase
    computed_stats: HorseStatsComputed

    class Config:
        from_attributes = True

class HorseBoxBuy(BaseModel):
    max_level: int = 3
    transaction_signature: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionSignature(BaseModel):
    transaction_signature: str

    class Config:
        from_attributes = True

class HorseStatsResponse(BaseModel):

    id: UUID
    horse_id: UUID
    weight: int
    determination: int
    satiety: int
    energy: int
    bond: int
    fame: int
    instinct: int
    level: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HorseStatsDetailResponse(BaseModel):

    base_stats: dict
    dynamic_stats: dict
    performance: dict

    class Config:
        from_attributes = True

class MintNFTResponse(BaseModel):
    message: str
    nft_mint: str
    explorer_url: str

    class Config:
        from_attributes = True


class TrainResponse(BaseModel):
    success: bool
    old_determination: int
    new_determination: int
    message: str

    class Config:
        from_attributes = True