from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class WalletLogin(BaseModel):
    wallet_address: str
    signature: str
    message: str

class UserResponse(BaseModel):
    id: UUID
    wallet_address: str
    wallet_connected_at: datetime
    created_at: datetime
    last_login: Optional[datetime] = None
    goodluck_count: int = 0
    is_admin: bool = False

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    wallet_address: str | None = None

class WalletConnect(BaseModel):
    wallet_address: str
    signature: str

class WalletConnectResponse(BaseModel):
    message: str
    wallet_address: str

    class Config:
        from_attributes = True