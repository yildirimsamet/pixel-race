
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Horse(Base):


    __tablename__ = "horses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    birthdate = Column(Date, nullable=False)
    color = Column(String(7), nullable=False)

    nft_mint_address = Column(String, nullable=True, unique=True)
    nft_metadata_uri = Column(String, nullable=True)
    minted_at = Column(DateTime, nullable=True)

    purchase_tx_signature = Column(String, nullable=True, unique=True, index=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    in_race = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="horses")
    race_results = relationship("RaceResult", back_populates="horse", cascade="all, delete-orphan")
    stats = relationship("HorseStats", back_populates="horse", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_horses_user_id", "user_id"),
        Index("ix_horses_in_race", "in_race"),
        Index("ix_horses_created_at", "created_at"),
        Index("ix_horses_nft_mint_address", "nft_mint_address"),
        Index("ix_horses_birthdate", "birthdate"),
        Index("ix_horses_user_id_in_race", "user_id", "in_race"),
    )

    @property
    def age(self) -> int:

        today = date.today()
        age = today.year - self.birthdate.year
        if (today.month, today.day) < (self.birthdate.month, self.birthdate.day):
            age -= 1
        return max(0, age)

    def __repr__(self) -> str:

        return f"<Horse(id={self.id}, name={self.name}, age={self.age})>"