
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class HorseStats(Base):


    __tablename__ = "horse_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    horse_id = Column(UUID(as_uuid=True), ForeignKey("horses.id", ondelete="CASCADE"), nullable=False, unique=True)

    weight = Column(Integer, nullable=False)
    determination = Column(Integer, nullable=False)
    energy = Column(Integer, nullable=False, default=100)
    satiety = Column(Integer, nullable=False, default=100)

    bond = Column(Integer, nullable=False, default=0)
    fame = Column(Integer, nullable=False, default=0)
    instinct = Column(Integer, nullable=False, default=0)

    level = Column(Integer, nullable=False, default=1)


    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    horse = relationship("Horse", back_populates="stats")

    __table_args__ = (
        CheckConstraint("weight >= 300 AND weight <= 1000", name="check_weight_range"),
        CheckConstraint("determination >= 0 AND determination <= 100", name="check_determination_range"),
        CheckConstraint("energy >= 0 AND energy <= 100", name="check_energy_range"),
        CheckConstraint("satiety >= 0 AND satiety <= 100", name="check_satiety_range"),
        CheckConstraint("bond >= 0 AND bond <= 100", name="check_bond_range"),
        CheckConstraint("fame >= 0 AND fame <= 100", name="check_fame_range"),
        CheckConstraint("instinct >= 0 AND instinct <= 100", name="check_instinct_range"),
        CheckConstraint("level >= 1 AND level <= 3", name="check_level_range"),
        Index("ix_horse_stats_horse_id", "horse_id"),
        Index("ix_horse_stats_level", "level"),
    )

    @property
    def speed_score(self) -> float:

        from app.core.game_mechanics import calculate_speed_score
        if self.horse:
            return calculate_speed_score(self, self.horse.age)
        return calculate_speed_score(self, 5)

    def __repr__(self) -> str:

        return f"<HorseStats(horse_id={self.horse_id}, weight={self.weight}, determination={self.determination})>"