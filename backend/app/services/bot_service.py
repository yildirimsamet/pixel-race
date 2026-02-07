
import asyncio
import random
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import BOT_CONFIG
from app.models.user import User
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.race import Race, RaceStatus, RaceResult

logger = logging.getLogger(__name__)


class BotService:
    def __init__(self):
        self.config = BOT_CONFIG
        self.bot_wallets = self._load_bot_wallets()
        self.last_registration_time: Dict[str, datetime] = {}
        self._max_registration_cache_size = 1000

    def _load_bot_wallets(self) -> List[str]:
        wallets = []
        if settings.BOT_WALLET_1:
            wallets.append(settings.BOT_WALLET_1)
        if settings.BOT_WALLET_2:
            wallets.append(settings.BOT_WALLET_2)
        if settings.BOT_WALLET_3:
            wallets.append(settings.BOT_WALLET_3)
        if settings.BOT_WALLET_4:
            wallets.append(settings.BOT_WALLET_4)
        if settings.BOT_WALLET_5:
            wallets.append(settings.BOT_WALLET_5)
        if settings.BOT_WALLET_6:
            wallets.append(settings.BOT_WALLET_6)

        for i, wallet in enumerate(wallets):
            if i < len(self.config["bots"]):
                self.config["bots"][i]["wallet_address"] = wallet

        return wallets

    async def initialize_bot_accounts(self, db: AsyncSession) -> None:
        if not self.config["startup"]["create_bot_accounts"]:
            logger.info("Bot account creation disabled in config")
            return

        if not self.bot_wallets:
            logger.warning("No bot wallets configured, skipping bot initialization")
            return

        logger.info(f"Initializing {len(self.bot_wallets)} bot accounts...")

        for wallet_address in self.bot_wallets:
            await self._create_or_update_bot_account(db, wallet_address)

        await db.commit()
        logger.info("Bot accounts initialized successfully")

    async def _create_or_update_bot_account(
        self, db: AsyncSession, wallet_address: str
    ) -> User:
        result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                wallet_address=wallet_address,
                wallet_connected_at=datetime.utcnow(),
                nonce="bot_nonce",  # Bots don't need auth
                is_bot=True
            )
            db.add(user)
            await db.flush()
            logger.info(f"Created bot user: {wallet_address[:8]}...")
        else:
            if not user.is_bot:
                user.is_bot = True
                logger.info(f"Updated existing user {wallet_address[:8]}... to is_bot=True")

        result = await db.execute(
            select(Horse).where(Horse.user_id == user.id)
        )
        existing_horses = result.scalars().all()

        horses_needed = self.config["startup"]["horses_per_bot"] - len(existing_horses)

        if horses_needed > 0:
            for level in self.config["startup"]["horse_levels"][:horses_needed]:
                horse = await self._create_bot_horse(db, user.id, level)
                logger.info(
                    f"Created bot horse '{horse.name}' (Level {level}) "
                    f"for {wallet_address[:8]}..."
                )

        return user

    async def _create_bot_horse(
        self, db: AsyncSession, user_id: UUID, level: int
    ) -> Horse:
        from app.services.horse_factory import HorseFactory

        factory = HorseFactory()
        horse, stats = await factory.create_horse(
            db=db,
            user_id=user_id,
            level=level
        )
        return horse

    async def should_register_bot(
        self, db: AsyncSession, race: Race
    ) -> bool:
        if not self.config["enabled"]:
            return False

        is_1v1 = race.max_horses == 2

        if is_1v1:
            level_config = self.config["race_levels_1v1"].get(race.level_requirement)
        else:
            level_config = self.config["race_levels"].get(race.level_requirement)

        if not level_config or not level_config["enabled"]:
            return False

        now = datetime.utcnow()
        time_remaining = (race.start_time - now).total_seconds()

        if time_remaining > level_config["time_remaining_seconds"]:
            return False

        if time_remaining < 15:
            return False

        if time_remaining < 0:
            return False

        result = await db.execute(
            select(RaceResult)
            .join(Horse, RaceResult.horse_id == Horse.id)
            .join(User, Horse.user_id == User.id)
            .where(RaceResult.race_id == race.id)
            .where(User.wallet_address.in_(self.bot_wallets))
        )
        bot_count = len(result.scalars().all())

        if bot_count >= level_config["max_bots_per_race"]:
            logger.debug(f"Race {str(race.id)[:8]}: bot_count ({bot_count}) >= max_bots ({level_config['max_bots_per_race']}) - STOP")
            return False

        logger.debug(f"Race {str(race.id)[:8]}: bot_count = {bot_count}/{level_config['max_bots_per_race']} - OK")

        result = await db.execute(
            select(RaceResult).where(RaceResult.race_id == race.id)
        )
        registered_count = len(result.scalars().all())

        if registered_count >= level_config["min_registered_horses"]:
            return False

        race_key = str(race.id)
        if race_key in self.last_registration_time:
            time_since_last = (now - self.last_registration_time[race_key]).total_seconds()
            interval = level_config["registration_interval_seconds"]
            if self.config["anti_detection"]["randomize_join_timing"]:
                variance = self.config["anti_detection"]["timing_variance_seconds"]
                interval = random.uniform(interval - variance, interval + variance)

            if time_since_last < interval:
                logger.debug(f"Race {str(race.id)[:8]}: Too soon since last bot ({time_since_last:.1f}s < {interval:.1f}s)")
                return False

        skip_chance = self.config["anti_detection"]["skip_race_chance"] / 100.0
        if random.random() < skip_chance:
            logger.info(f"Bot randomly skipping race {race.id} for natural behavior (skip_chance: {self.config['anti_detection']['skip_race_chance']}%)")
            return False

        return True

    async def register_bot_for_race(
        self, db: AsyncSession, race: Race
    ) -> Optional[RaceResult]:
        if not self.bot_wallets:
            logger.warning("No bot wallets configured")
            return None

        from sqlalchemy.orm import selectinload

        result = await db.execute(
            select(User).where(User.wallet_address.in_(self.bot_wallets))
        )
        bot_users = result.scalars().all()

        if not bot_users:
            logger.warning("No bot users found in database")
            return None

        bot_user_ids = [user.id for user in bot_users]

        result = await db.execute(
            select(Horse.user_id)
            .join(RaceResult, RaceResult.horse_id == Horse.id)
            .where(RaceResult.race_id == race.id)
            .where(Horse.user_id.in_(bot_user_ids))
        )
        users_already_in_race = set(result.scalars().all())

        eligible_bot_users = [user for user in bot_users if user.id not in users_already_in_race]

        if not eligible_bot_users:
            logger.debug(f"All bots already in race {race.id}")
            return None

        eligible_user_ids = [user.id for user in eligible_bot_users]

        result = await db.execute(
            select(Horse)
            .join(HorseStats, Horse.id == HorseStats.horse_id)
            .where(Horse.user_id.in_(eligible_user_ids))
            .where(Horse.in_race == False)
            .where(HorseStats.level == race.level_requirement)
            .options(selectinload(Horse.owner))
        )
        available_horses = result.scalars().all()

        if not available_horses:
            logger.warning(f"No available bot horses for race {race.id}")
            return None

        available_bots = {}
        for horse in available_horses:
            user_id = horse.user_id
            if user_id not in available_bots:
                available_bots[user_id] = {
                    "user": next(u for u in eligible_bot_users if u.id == user_id),
                    "horses": []
                }
            available_bots[user_id]["horses"].append(horse)

        if not available_bots:
            logger.warning(f"No available bot horses for race {race.id}")
            return None

        selected_bot = random.choice(list(available_bots.values()))

        if self.config["anti_detection"]["use_random_horse"]:
            selected_horse = random.choice(selected_bot["horses"])
        else:
            selected_horse = selected_bot["horses"][0]

        try:
            selected_horse.in_race = True

            race.prize_pool_sol += race.entry_fee
            logger.debug(f"Bot simulated entry: {race.entry_fee} SOL added to prize pool (no actual payment, bots won't receive rewards)")

            race_result = RaceResult(
                race_id=race.id,
                horse_id=selected_horse.id
            )
            db.add(race_result)
            await db.flush()

            race_key = str(race.id)
            self.last_registration_time[race_key] = datetime.utcnow()

            if len(self.last_registration_time) > self._max_registration_cache_size:
                cutoff = datetime.utcnow()
                cutoff = cutoff.replace(hour=cutoff.hour - 1) if cutoff.hour > 0 else cutoff
                self.last_registration_time = {
                    k: v for k, v in self.last_registration_time.items()
                    if v > cutoff
                }

            logger.info(
                f"Bot registered horse '{selected_horse.name}' "
                f"(ID: {selected_horse.id}) for race {race.id}"
            )

            await self._notify_socket_registration(race, selected_horse, db)

            return race_result

        except Exception as e:
            logger.error(f"Failed to register bot for race {race.id}: {e}")
            await db.rollback()
            return None

    async def _notify_socket_registration(
        self, race: Race, horse: Horse, db: AsyncSession
    ) -> None:
        try:
            import httpx
            from app.core.config import settings
            from app.repositories.race_repository import RaceResultRepository

            result_repo = RaceResultRepository(db)
            registered_count = await result_repo.count_by_race_id(race.id)

            max_retries = 2
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=3.0) as client:
                        await client.post(
                            f"{settings.SOCKET_SERVER_URL}/races/{race.id}/registration",
                            json={
                                "horse_name": horse.name,
                                "registered_count": registered_count,
                                "max_horses": race.max_horses
                            }
                        )
                        logger.debug(
                            f"Notified socket server of bot registration for race {race.id}"
                        )
                        return
                except (httpx.ConnectError, httpx.TimeoutException) as e:
                    if attempt < max_retries - 1:
                        logger.debug(f"Socket notification retry {attempt + 1}/{max_retries} for race {race.id}: {e}")
                        await asyncio.sleep(0.5)
                        continue
                    raise
        except Exception as e:
            if "Temporary failure" in str(e) or "ConnectError" in type(e).__name__:
                logger.debug(f"Socket server temporarily unreachable for race {race.id}: {e}")
            else:
                logger.warning(f"Failed to notify socket server of bot registration: {e}")

    async def process_waiting_races(self, db: AsyncSession) -> None:
        if not self.config["enabled"]:
            return

        from sqlalchemy.orm import selectinload

        result = await db.execute(
            select(Race)
            .where(Race.status == RaceStatus.waiting)
            .options(selectinload(Race.race_results))
        )
        waiting_races = result.scalars().all()

        for race in waiting_races:
            should_register = await self.should_register_bot(db, race)

            if should_register:
                result = await self.register_bot_for_race(db, race)
                if result:
                    await db.commit()
                    logger.info(f"✅ Bot registered for race {str(race.id)[:8]}...")
                else:
                    await db.rollback()


bot_service = BotService()