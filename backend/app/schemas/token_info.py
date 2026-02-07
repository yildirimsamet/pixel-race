
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class TokenInfoResponse(BaseModel):
    token_name: str = Field(..., description="Name of the token")
    contract_address: str = Field(..., description="Solana contract address")
    token_url: str = Field(..., description="URL to token page (e.g., pump.fun)")
    description: Optional[str] = Field(None, description="Optional token description")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class TokenInfoUpdate(BaseModel):
    token_name: Optional[str] = Field(None, min_length=1, max_length=100)
    contract_address: Optional[str] = Field(None, min_length=32, max_length=255)
    token_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
