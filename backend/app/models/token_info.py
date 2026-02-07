
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base


class TokenInfo(Base):
    __tablename__ = "token_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_name = Column(String(100), nullable=False, default="Pixel Race Token")
    contract_address = Column(String(255), nullable=False)
    token_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TokenInfo(name={self.token_name}, contract={self.contract_address[:8]}...)>"
