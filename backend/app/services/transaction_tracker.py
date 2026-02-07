
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.race import RaceResult

logger = get_logger(__name__)


class TransactionTracker:


    @staticmethod
    async def is_transaction_used(
        db: AsyncSession,
        tx_signature: str
    ) -> bool:

        horse_result = await db.execute(
            select(Horse).where(Horse.purchase_tx_signature == tx_signature).limit(1)
        )
        if horse_result.scalar_one_or_none():
            logger.warning(f"Transaction signature already used for horse purchase: {tx_signature[:16]}...")
            return True

        race_result = await db.execute(
            select(RaceResult).where(RaceResult.entry_tx_signature == tx_signature).limit(1)
        )
        if race_result.scalar_one_or_none():
            logger.warning(f"Transaction signature already used for race entry: {tx_signature[:16]}...")
            return True

        return False

    @staticmethod
    async def mark_transaction_used_for_horse(
        db: AsyncSession,
        horse_id: str,
        tx_signature: str
    ) -> None:

        result = await db.execute(select(Horse).where(Horse.id == horse_id))
        horse = result.scalar_one_or_none()

        if horse:
            horse.purchase_tx_signature = tx_signature
            await db.flush()
            logger.debug(f"Marked transaction {tx_signature[:16]}... as used for horse {horse_id}")

    @staticmethod
    async def mark_transaction_used_for_race(
        db: AsyncSession,
        race_result_id: str,
        tx_signature: str
    ) -> None:

        result = await db.execute(select(RaceResult).where(RaceResult.id == race_result_id))
        race_result = result.scalar_one_or_none()

        if race_result:
            race_result.entry_tx_signature = tx_signature
            await db.flush()
            logger.debug(f"Marked transaction {tx_signature[:16]}... as used for race entry")


transaction_tracker = TransactionTracker()