
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Boolean,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class RaceStatus(str, enum.Enum):


    waiting = "waiting"
    racing = "racing"
    done = "done"
    cancelled = "cancelled"


class Race(Base):


    __tablename__ = "races"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_fee = Column(Float, nullable=False)
    max_horses = Column(Integer, nullable=False)
    min_horses = Column(Integer, nullable=False)
    status = Column(SQLEnum(RaceStatus), default=RaceStatus.waiting, nullable=False)
    start_time = Column(DateTime, nullable=False)
    level_requirement = Column(Integer, nullable=False)
    prize_pool_sol = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    race_results = relationship("RaceResult", back_populates="race", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("entry_fee >= 0", name="check_entry_fee_positive"),
        CheckConstraint("max_horses >= min_horses", name="check_max_min_horses"),
        CheckConstraint("level_requirement >= 1 AND level_requirement <= 3", name="check_level_requirement_range"),
        Index("ix_races_status", "status"),
        Index("ix_races_start_time", "start_time"),
        Index("ix_races_level_requirement", "level_requirement"),
        Index("ix_races_created_at", "created_at"),
        Index("ix_races_status_start_time", "status", "start_time"),
    )

    def __repr__(self) -> str:

        return f"<Race(id={self.id}, level={self.level_requirement}, status={self.status.value})>"


class RaceResult(Base):


    __tablename__ = "race_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    race_id = Column(UUID(as_uuid=True), ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    horse_id = Column(UUID(as_uuid=True), ForeignKey("horses.id", ondelete="CASCADE"), nullable=False)
    finish_position = Column(Integer, nullable=True)
    finish_time_ms = Column(Integer, nullable=True)
    race_segments = Column(String, nullable=True)
    reward_amount = Column(Float, default=0.0, nullable=False)
    reward_tx_signature = Column(String, nullable=True)
    entry_tx_signature = Column(String, nullable=True, unique=True, index=True)
    goodluck_used = Column(Boolean, default=False, nullable=False)
    stats_before = Column(JSON, nullable=True)
    stats_after = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    race = relationship("Race", back_populates="race_results")
    horse = relationship("Horse", back_populates="race_results")

    __table_args__ = (
        CheckConstraint("reward_amount >= 0", name="check_reward_positive"),
        CheckConstraint("finish_position >= 1", name="check_finish_position_positive"),
        Index("uq_race_horse", "race_id", "horse_id", unique=True),
        Index("ix_race_results_race_id", "race_id"),
        Index("ix_race_results_horse_id", "horse_id"),
        Index("ix_race_results_created_at", "created_at"),
    )

    def __repr__(self) -> str:

        return f"<RaceResult(race_id={self.race_id}, horse_id={self.horse_id}, position={self.finish_position})>"