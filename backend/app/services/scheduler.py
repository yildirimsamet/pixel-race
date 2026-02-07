
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import AsyncGenerator

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core import game_config
from app.core.logging_config import get_logger
from app.db.base import AsyncSessionLocal
from app.models.horse import Horse
from app.models.race import Race, RaceResult, RaceStatus
from app.models.user import User
from app.repositories.horse_repository import HorseRepository
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.application.race.start_race_use_case import StartRaceUseCase, StartRaceCommand
from app.services.race_logic import calculate_rewards
from app.services.treasury_monitor import treasury_monitor
from app.services.bot_service import bot_service
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()


async def check_treasury_balance() -> None:

    try:
        balance, is_low = await treasury_monitor.check_balance()
        if is_low:
            logger.warning(f"Treasury balance is low: {balance:.4f} SOL")
        else:
            logger.debug(f"Treasury balance OK: {balance:.4f} SOL")
    except Exception as e:
        logger.error(f"Error in treasury balance check: {e}", exc_info=True)


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database error: {e}")
            raise


async def create_race_for_level(
    db: AsyncSession, level: int, delay_seconds: int = 0, is_1v1: bool = False
) -> None:

    if level not in [1, 2, 3]:
        logger.error(f"Invalid race level: {level}")
        return

    start_time = datetime.utcnow() + timedelta(
        minutes=game_config.get_race_start_delay(), seconds=delay_seconds
    )
    config = game_config.get_race_config(level, is_1v1=is_1v1)

    race_repo = RaceRepository(db)
    new_race = await race_repo.create(
        entry_fee=config["entry_fee"],
        max_horses=config["max_horses"],
        min_horses=config["min_horses"],
        start_time=start_time,
        level_requirement=level,
        status=RaceStatus.waiting,
    )

    race_type = "1v1" if is_1v1 else "standard"
    logger.info(f"✅ Created {race_type} race {new_race.id} for level {level} starting at {start_time}")


async def auto_create_races() -> None:

    async with get_db_session() as db:
        for idx, level in enumerate([1, 2, 3]):
            delay_seconds = idx * 60
            await create_race_for_level(db, level, delay_seconds, is_1v1=False)

        for idx, level in enumerate([1, 2, 3]):
            delay_seconds = idx * 60 + 30
            await create_race_for_level(db, level, delay_seconds, is_1v1=True)

            delay_seconds = idx * 60 + 90
            await create_race_for_level(db, level, delay_seconds, is_1v1=True)


async def auto_register_bots() -> None:

    async with AsyncSessionLocal() as db:
        try:
            race_repo = RaceRepository(db)
            waiting_races = await race_repo.get_by_status(RaceStatus.waiting)
            if not waiting_races:
                logger.debug("No waiting races, skipping bot registration")
                return

            await bot_service.process_waiting_races(db)
        except Exception as e:
            logger.error(f"Error in auto_register_bots: {e}", exc_info=True)
            await db.rollback()


async def auto_start_or_cancel_races(level: int | None = None) -> None:

    async with AsyncSessionLocal() as db:
        try:
            race_repo = RaceRepository(db)
            result_repo = RaceResultRepository(db)
            horse_repo = HorseRepository(db)

            now = datetime.utcnow()
            waiting_races = await race_repo.get_races_to_start(now, level)

            if not waiting_races:
                logger.debug("No races ready to start or cancel")
                return

            for race in waiting_races:
                registered_count = await result_repo.count_by_race_id(race.id)

                if registered_count >= race.min_horses:
                    logger.info(f"Auto-starting race {race.id} with {registered_count} horses")
                    await _start_race_wrapper(race.id)
                else:
                    logger.info(f"Auto-cancelling race {race.id} - not enough horses ({registered_count}/{race.min_horses})")
                    await _cancel_race_wrapper(race.id)
        except Exception as e:
            logger.error(f"Error in auto_start_or_cancel_races: {e}", exc_info=True)
            await db.rollback()


async def _start_race_wrapper(race_id: str) -> None:

    async with AsyncSessionLocal() as db:
        try:
            race_repo = RaceRepository(db)
            result_repo = RaceResultRepository(db)
            horse_repo = HorseRepository(db)

            result = await db.execute(
                select(Race)
                .where(Race.id == race_id)
                .with_for_update(nowait=True)
            )
            race = result.scalar_one_or_none()

            if not race or race.status != RaceStatus.waiting:
                logger.debug(f"Race {race_id} already processed or not found (status: {race.status if race else 'N/A'})")
                return

            await _start_race(db, race, race_repo, result_repo, horse_repo)
        except Exception as e:
            logger.error(f"Error in _start_race_wrapper for race {race_id}: {e}", exc_info=True)
            await db.rollback()


async def _cancel_race_wrapper(race_id: str) -> None:

    async with AsyncSessionLocal() as db:
        try:
            race_repo = RaceRepository(db)
            result_repo = RaceResultRepository(db)
            horse_repo = HorseRepository(db)

            race = await race_repo.get_by_id(race_id)
            if not race:
                logger.error(f"Race {race_id} not found")
                return

            await _cancel_race(db, race, race_repo, result_repo, horse_repo)
        except Exception as e:
            logger.error(f"Error in _cancel_race_wrapper for race {race_id}: {e}", exc_info=True)
            await db.rollback()


async def _start_race(
    db: AsyncSession,
    race: Race,
    race_repo: RaceRepository,
    result_repo: RaceResultRepository,
    horse_repo: HorseRepository,
) -> None:

    try:
        logger.info(f"🏁 Starting race {race.id}")

        start_race_use_case = StartRaceUseCase()
        command = StartRaceCommand(race_id=race.id)
        result = await start_race_use_case.execute(db, command)

        logger.info(f"✅ Race {race.id} started successfully")

    except Exception as e:
        logger.error(f"Failed to start race {race.id}: {e}", exc_info=True)
        await db.rollback()


async def _cancel_race(
    db: AsyncSession,
    race: Race,
    race_repo: RaceRepository,
    result_repo: RaceResultRepository,
    horse_repo: HorseRepository,
) -> None:

    try:
        import asyncio
        from app.services.solana_service import SolanaService
        from app.models.notification import NotificationType
        from app.repositories.notification_repository import NotificationRepository

        registered_count = await result_repo.count_by_race_id(race.id)
        logger.info(
            f"❌ Cancelling race {race.id} - not enough horses ({registered_count}/{race.min_horses})"
        )

        race.status = RaceStatus.cancelled
        race_results = await result_repo.get_by_race_id(race.id)

        solana_service = SolanaService()
        notification_repo = NotificationRepository(db)

        from sqlalchemy.orm import selectinload

        result = await db.execute(
            select(Horse)
            .join(RaceResult, RaceResult.horse_id == Horse.id)
            .where(RaceResult.race_id == race.id)
            .options(selectinload(Horse.owner))
        )
        horses = result.scalars().all()

        for horse in horses:
            horse.in_race = False

        notification_tasks = []
        for horse in horses:
            owner = horse.owner
            if owner:
                is_bot = owner.is_bot
                cancellation_message = (
                    f"The race your horse {horse.name} was registered for has been cancelled due to insufficient participants."
                    if is_bot
                    else f"The race your horse {horse.name} was registered for has been cancelled due to insufficient participants. Entry fee will be refunded."
                )

                notification_tasks.append(
                    notification_repo.create(
                        user_id=owner.id,
                        notification_type=NotificationType.RACE_CANCELLED,
                        title=f"⚠️ Race Cancelled - {horse.name}",
                        message=cancellation_message,
                        race_id=race.id,
                        horse_id=horse.id,
                        amount_sol=race.entry_fee if not is_bot else 0
                    )
                )

        if notification_tasks:
            for task in notification_tasks:
                await task

        refund_count = 0
        for horse in horses:
            owner = horse.owner
            if owner and owner.is_bot:
                logger.info(
                    f"⏭️ Skipped refund for bot wallet {owner.wallet_address[:8]}... "
                    f"(race {race.id})"
                )
                continue

            if owner and race.entry_fee > 0:
                try:
                    refund_signature = await solana_service.transfer_sol(
                        to_wallet=owner.wallet_address,
                        amount_sol=race.entry_fee,
                        memo="Pixel Race - Race Entry Refund"
                    )

                    logger.info(
                        f"✅ Refunded {race.entry_fee} SOL to {owner.wallet_address[:8]}... "
                        f"(signature: {refund_signature[:16]}...)"
                    )

                    await notification_repo.create(
                        user_id=owner.id,
                        notification_type=NotificationType.REFUND,
                        title=f"💰 Refund Received - {race.entry_fee} SOL",
                        message=f"Your entry fee of {race.entry_fee} SOL for the cancelled race has been refunded.",
                        race_id=race.id,
                        horse_id=horse.id,
                        amount_sol=race.entry_fee,
                        transaction_signature=refund_signature
                    )
                    refund_count += 1
                except Exception as refund_error:
                    logger.error(
                        f"❌ Failed to refund {race.entry_fee} SOL to {owner.wallet_address[:8]}...: "
                        f"{refund_error}"
                    )

        await db.commit()

        await _notify_race_cancellation(race.id)

        logger.info(
            f"✅ Race {race.id} cancelled. Refunded {refund_count}/{registered_count} entry fees."
        )

    except Exception as e:
        logger.error(f"Failed to cancel race {race.id}: {e}")
        await db.rollback()


async def _notify_socket_server(race_id: str, horses_data: list) -> None:

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.SOCKET_SERVER_URL}/races/{race_id}/start",
                json={"horses": horses_data},
            )
            response.raise_for_status()
            logger.info(f"✅ Notified socket server for race {race_id}")
    except httpx.TimeoutException:
        logger.error(f"Timeout notifying socket server for race {race_id}")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error notifying socket server for race {race_id}: {e}")
    except Exception as e:
        logger.error(f"Failed to notify socket server for race {race_id}: {e}")


async def _notify_race_cancellation(race_id: str) -> None:

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{settings.SOCKET_SERVER_URL}/races/{race_id}/cancel",
                json={"race_id": str(race_id)},
            )
            response.raise_for_status()
            logger.info(f"✅ Notified socket server about race {race_id} cancellation")
    except httpx.TimeoutException:
        logger.error(f"Timeout notifying socket server about race {race_id} cancellation")
    except httpx.HTTPError as e:
        logger.error(f"HTTP error notifying socket server about race {race_id} cancellation: {e}")
    except Exception as e:
        logger.error(f"Failed to notify socket server about race {race_id} cancellation: {e}")


async def cleanup_stuck_races() -> None:

    async with AsyncSessionLocal() as db:
      try:
        race_repo = RaceRepository(db)
        result_repo = RaceResultRepository(db)
        horse_repo = HorseRepository(db)

        scheduler_cfg = game_config.get_scheduler_config()
        cutoff_time = datetime.utcnow() - timedelta(
            minutes=scheduler_cfg["stuck_race_timeout_minutes"]
        )
        stuck_races = await race_repo.get_stuck_races(cutoff_time)

        for race in stuck_races:
            logger.warning(f"🔧 Cleaning up stuck race {race.id}")
            await logging_service.log_action(
                user_id=None,
                action="CLEANUP_STUCK_RACE",
                step=LogStep.START,
                level=LogLevel.WARNING,
                message=f"Cleaning up stuck race {race.id}",
                metadata={"race_id": str(race.id)},
            )

            try:
                race_results = await result_repo.get_by_race_id(race.id)

                if race_results and not any(r.finish_position for r in race_results):
                    sorted_results = sorted(
                        [r for r in race_results if r.finish_time_ms],
                        key=lambda x: x.finish_time_ms,
                    )

                    rewards = calculate_rewards(race, sorted_results)

                    for position, result in enumerate(sorted_results, start=1):
                        result.finish_position = position
                        reward = rewards.get(position, 0)
                        result.reward_amount = reward

                        horse = await horse_repo.get_by_id(result.horse_id)
                        if horse:
                            horse.in_race = False

                race.status = RaceStatus.done
                await db.commit()
                logger.info(f"✅ Stuck race {race.id} marked as done")

            except Exception as e:
                logger.error(f"Failed to cleanup stuck race {race.id}: {e}")
                await db.rollback()
      except Exception as e:
        logger.error(f"Error in cleanup_stuck_races: {e}", exc_info=True)
        await db.rollback()


async def cleanup_old_races() -> None:

    async with AsyncSessionLocal() as db:
      try:
        race_repo = RaceRepository(db)
        result_repo = RaceResultRepository(db)

        scheduler_cfg = game_config.get_scheduler_config()
        races_to_delete = await race_repo.get_old_finished_races(
            scheduler_cfg["max_kept_old_races"]
        )

        if not races_to_delete:
            logger.debug("No old races to cleanup")
            return

        try:
            logger.info(f"🧹 Cleaning up {len(races_to_delete)} old races")

            for race in races_to_delete:
                await result_repo.delete_by_race_id(race.id)
                await race_repo.delete(race)

            await db.commit()
            logger.info(f"✅ Successfully deleted {len(races_to_delete)} old races")

        except Exception as e:
            logger.error(f"Error during race cleanup: {e}")
            await db.rollback()
      except Exception as e:
        logger.error(f"Error in cleanup_old_races: {e}", exc_info=True)
        await db.rollback()


async def decrease_horse_satiety() -> None:

    async with AsyncSessionLocal() as db:
        try:
            from app.models.horse_stats import HorseStats
            from sqlalchemy import update, case

            stmt = (
                update(HorseStats)
                .where(
                    HorseStats.horse_id.in_(
                        select(Horse.id)
                        .join(User, Horse.user_id == User.id)
                        .where((User.is_bot == False) | (User.is_bot == None))
                    )
                )
                .where(HorseStats.satiety > 0)
                .values(
                    satiety=case(
                        (HorseStats.satiety >= 2, HorseStats.satiety - 2),
                        else_=0
                    )
                )
            )

            result = await db.execute(stmt)
            updated_count = result.rowcount

            await db.commit()
            logger.info(f"✅ Decreased satiety for {updated_count} horses (excluding bots)")

        except Exception as e:
            logger.error(f"Error in decrease_horse_satiety: {e}", exc_info=True)
            await db.rollback()


async def increase_horse_energy() -> None:

    async with AsyncSessionLocal() as db:
        try:
            from app.models.horse_stats import HorseStats
            from sqlalchemy import update, case

            stmt = (
                update(HorseStats)
                .where(
                    HorseStats.horse_id.in_(
                        select(Horse.id)
                        .join(User, Horse.user_id == User.id)
                        .where((User.is_bot == False) | (User.is_bot == None))
                    )
                )
                .where(HorseStats.energy < 100)
                .values(
                    energy=case(
                        (HorseStats.energy + 4 <= 100, HorseStats.energy + 4),
                        else_=100
                    )
                )
            )

            result = await db.execute(stmt)
            updated_count = result.rowcount

            await db.commit()
            logger.info(f"✅ Increased energy for {updated_count} horses (excluding bots)")

        except Exception as e:
            logger.error(f"Error in increase_horse_energy: {e}", exc_info=True)
            await db.rollback()


async def cleanup_orphan_horses() -> None:

    async with AsyncSessionLocal() as db:
        try:
            from sqlalchemy import update

            stmt = (
                update(Horse)
                .where(Horse.in_race == True)
                .where(
                    Horse.id.in_(
                        select(RaceResult.horse_id)
                        .join(Race, RaceResult.race_id == Race.id)
                        .where(Race.status.in_([RaceStatus.done, RaceStatus.cancelled]))
                    )
                )
                .values(in_race=False)
            )

            result = await db.execute(stmt)
            fixed_count = result.rowcount

            if fixed_count > 0:
                await db.commit()
                logger.info(f"✅ Fixed {fixed_count} orphan horses stuck in_race=True")
            else:
                logger.debug("No orphan horses found")

        except Exception as e:
            logger.error(f"Error in cleanup_orphan_horses: {e}", exc_info=True)
            await db.rollback()


def start_scheduler() -> None:

    scheduler.add_job(
        auto_create_races,
        "interval",
        minutes=3,
        id="auto_create_races",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        auto_register_bots,
        "interval",
        seconds=6,
        id="auto_register_bots",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        auto_start_or_cancel_races,
        "interval",
        seconds=3,
        args=[1],
        id="auto_start_cancel_races_1",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        auto_start_or_cancel_races,
        "interval",
        seconds=3,
        args=[2],
        id="auto_start_cancel_races_2",
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        auto_start_or_cancel_races,
        "interval",
        seconds=3,
        args=[3],
        id="auto_start_cancel_races_3",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        cleanup_stuck_races,
        "interval",
        seconds=15,
        id="cleanup_stuck_races",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        cleanup_old_races,
        "interval",
        minutes=10,
        id="cleanup_old_races",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        check_treasury_balance,
        "interval",
        minutes=1,
        id="check_treasury_balance",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        decrease_horse_satiety,
        "interval",
        minutes=30,
        id="decrease_horse_satiety",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        increase_horse_energy,
        "interval",
        minutes=15,
        id="increase_horse_energy",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        cleanup_orphan_horses,
        "interval",
        seconds=30,
        id="cleanup_orphan_horses",
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    logger.info("✅ Scheduler started with jobs:")
    logger.info("  - auto_create_races: every 3 minutes")
    logger.info("  - auto_register_bots: every 3 seconds")
    logger.info("  - auto_start_or_cancel_races: every 3 seconds")
    logger.info("  - cleanup_stuck_races: every 15 seconds")
    logger.info("  - cleanup_old_races: every 10 minutes")
    logger.info("  - check_treasury_balance: every 1 minute")
    logger.info("  - decrease_horse_satiety: every 30 minutes")
    logger.info("  - increase_horse_energy: every 15 minutes")
    logger.info("  - cleanup_orphan_horses: every 30 seconds")


def stop_scheduler() -> None:

    if scheduler.running:
        scheduler.shutdown()
        logger.info("✅ Scheduler stopped")