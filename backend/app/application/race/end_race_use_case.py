from dataclasses import dataclass
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import BOT_CONFIG
from app.core.exceptions import NotFoundError
from app.core.logging_config import get_logger
from app.models.horse import Horse
from app.models.horse_stats import HorseStats
from app.models.notification import NotificationType
from app.models.race import RaceStatus
from app.models.user import User
from app.models.user_reward import RewardType
from app.repositories.notification_repository import NotificationRepository
from app.repositories.race_repository import RaceRepository, RaceResultRepository
from app.services.race_logic import calculate_rewards
from app.services.reward_service import RewardService
from app.services.solana_service import SolanaService
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

logger = get_logger(__name__)


@dataclass
class RaceEndResult:

    horse_id: str
    finish_time_ms: int
    position: int


@dataclass
class EndRaceCommand:

    race_id: UUID
    results: List[RaceEndResult]
    request_id: Optional[UUID] = None


@dataclass
class RaceEndedResult:

    race_id: UUID
    prize_pool: float
    rewards_distributed: List[Dict]
    message: str = "Race results processed"


class EndRaceUseCase:


    def __init__(self):
        self.solana_service = SolanaService()

    async def _grant_consolation_goodluck_charm(
        self,
        db: AsyncSession,
        race,
        race_results: List,
        notification_repo: NotificationRepository
    ) -> None:
        try:
            is_1v1_race = race.max_horses == 2
            target_position = 2 if is_1v1_race else 4

            target_result = None
            for result in race_results:
                if result.finish_position == target_position:
                    target_result = result
                    break

            if not target_result:
                logger.debug(f"No {target_position}th place finisher found in race {race.id}")
                return

            horse = target_result.horse
            if not horse or not horse.owner:
                logger.debug(f"No horse or owner found for {target_position}th place in race {race.id}")
                return

            owner = horse.owner

            if owner.is_bot:
                logger.info(f"Skipping consolation charm for bot {owner.wallet_address[:8]}... in race {race.id}")
                return

            owner.goodluck_count += 1
            await db.flush()

            logger.info(
                f"🎁 Consolation GoodLuck charm granted to {owner.wallet_address[:8]}... "
                f"for {target_position}th place in race {race.id}"
            )

            race_type_text = "1v1" if is_1v1_race else "multi-player"
            position_text = "2nd" if target_position == 2 else "4th"

            await notification_repo.create(
                user_id=owner.id,
                notification_type=NotificationType.CONSOLATION_GOODLUCK,
                title=f"🍀 Consolation Prize - {horse.name}!",
                message=f"Your horse {horse.name} finished in {position_text} place in a {race_type_text} race. You've earned 1 free GoodLuck Charm!",
                race_id=race.id,
                horse_id=horse.id,
                amount_sol=0
            )

            await self._broadcast_consolation_charm(
                race_id=race.id,
                user_id=owner.id,
                horse_name=horse.name,
                position=target_position
            )

        except Exception as e:
            logger.error(f"Error granting consolation charm in race {race.id}: {e}", exc_info=True)

    async def _broadcast_consolation_charm(
        self,
        race_id: UUID,
        user_id: UUID,
        horse_name: str,
        position: int
    ) -> None:
        try:
            import httpx
            from app.core.config import settings

            payload = {
                "race_id": str(race_id),
                "user_id": str(user_id),
                "horse_name": horse_name,
                "finish_position": position,
                "reward_type": "goodluck_charm",
                "reward_amount": 1
            }

            logger.info(f"Broadcasting consolation charm: {payload}")

            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{settings.SOCKET_SERVER_URL}/broadcast/consolation-reward",
                    json=payload
                )
                response.raise_for_status()
                logger.info(f"✅ Successfully broadcasted consolation charm for race {race_id}")
        except Exception as e:
            logger.error(f"❌ Failed to broadcast consolation charm: {e}", exc_info=True)

    async def execute(self, db: AsyncSession, command: EndRaceCommand) -> RaceEndedResult:

        logger.info(f"Ending race {command.race_id} with {len(command.results)} results")

        race_repo = RaceRepository(db)
        race = await race_repo.get_by_id(command.race_id)

        if not race:
            logger.warning(f"Race {command.race_id} not found")

            await logging_service.log_action(
                user_id=None,
                action=LogAction.RACE_END,
                step=LogStep.ERROR,
                level=LogLevel.ERROR,
                message=f"Race not found: {command.race_id}",
                metadata={"race_id": str(command.race_id)},
                request_id=command.request_id,
            )

            raise NotFoundError("Race")

        if race.status not in [RaceStatus.racing, RaceStatus.waiting]:
            from app.core.exceptions import RaceNotAvailableError
            logger.error(
                f"Cannot end race {command.race_id} with status {race.status.value}. "
                f"Expected racing or waiting."
            )
            raise RaceNotAvailableError(
                f"Cannot end race with status {race.status.value}. "
                f"Expected racing or waiting."
            )

        race_result_repo = RaceResultRepository(db)
        race_results = await race_result_repo.get_by_race_id(command.race_id)
        rewards = calculate_rewards(race, race_results)

        logger.debug(f"Calculated rewards for race {command.race_id}: {rewards}")

        notification_repo = NotificationRepository(db)

        transferred_rewards = []

        for result_data in command.results:
            race_result = await race_result_repo.get_by_race_and_horse(
                command.race_id, UUID(result_data.horse_id)
            )

            if race_result:
                race_result.finish_position = result_data.position
                reward = rewards.get(result_data.position, 0)
                race_result.reward_amount = reward

                await db.flush()

                horse = race_result.horse

                if horse:
                    horse.in_race = False

                    owner_result = await db.execute(
                        select(User).where(User.id == horse.user_id)
                    )
                    owner = owner_result.scalar_one_or_none()

                    is_bot = owner and owner.is_bot

                    if owner:
                        logger.info(f"Horse {horse.id} owner: {owner.wallet_address[:8]}..., is_bot={owner.is_bot}")
                    else:
                        logger.warning(f"Horse {horse.id} has no owner!")

                    if is_bot:
                        race_result.reward_amount = 0
                        logger.info(f"BOT DETECTED: Skipped stats and zeroed reward for bot horse {horse.id} (owner: {owner.wallet_address[:8]}...)")
                        continue

                    stats_result = await db.execute(
                        select(HorseStats).where(HorseStats.horse_id == horse.id)
                    )
                    stats = stats_result.scalar_one_or_none()

                    if stats:
                        stats_before_snapshot = {
                            "energy": stats.energy,
                            "satiety": stats.satiety,
                            "bond": stats.bond,
                            "fame": stats.fame,
                            "instinct": stats.instinct,
                            "determination": stats.determination,
                            "weight": int(stats.weight)
                        }

                        if stats.energy >= 10:
                            stats.energy -= 10
                        if stats.satiety >= 10:
                            stats.satiety -= 10

                        stats.bond = min(100, stats.bond + 2)

                        fame_gain = {1: 3, 2: 2, 3: 1}.get(result_data.position, 0)
                        stats.fame = min(100, stats.fame + fame_gain)

                        import random
                        if random.random() < 0.25:
                            stats.instinct = min(100, stats.instinct + 2)
                            logger.debug(f"Instinct increased for horse {horse.id}")

                        stats_after_snapshot = {
                            "energy": stats.energy,
                            "satiety": stats.satiety,
                            "bond": stats.bond,
                            "fame": stats.fame,
                            "instinct": stats.instinct,
                            "determination": stats.determination,
                            "weight": int(stats.weight)
                        }

                        race_result.stats_before = stats_before_snapshot
                        race_result.stats_after = stats_after_snapshot

                        logger.debug(
                            f"Updated stats for horse {horse.id}: "
                            f"bond={stats.bond}, fame={stats.fame}, instinct={stats.instinct}"
                        )


                    if horse.owner and not is_bot:
                        has_goodluck = await RewardService.has_reward(
                            db=db,
                            user_id=horse.owner.id,
                            reward_type=RewardType.GOODLUCK
                        )

                        if not has_goodluck:
                            goodluck_reward = await RewardService.grant_reward(
                                db=db,
                                user_id=horse.owner.id,
                                reward_type=RewardType.GOODLUCK,
                                auto_claim=False
                            )
                            if goodluck_reward:
                                logger.info(f"GoodLuck reward granted to user {horse.owner.id} after first race completion")

                    if reward > 0 and horse.owner:
                        if is_bot:
                            logger.info(f"Skipping reward distribution for bot {horse.owner.wallet_address[:8]}... (bots never receive rewards)")
                            race_result.reward_amount = 0
                            continue

                        try:
                            owner_wallet = horse.owner.wallet_address
                            logger.info(f"Transferring {reward} SOL to winner {owner_wallet[:8]}... (position {result_data.position})")

                            position_name = {1: "1st Place", 2: "2nd Place", 3: "3rd Place"}.get(result_data.position, f"{result_data.position}th Place")
                            tx_signature = await self.solana_service.transfer_sol(
                                to_wallet=owner_wallet,
                                amount_sol=reward,
                                memo=f"Pixel Race - Prize Reward ({position_name})"
                            )

                            race_result.reward_tx_signature = tx_signature
                            transferred_rewards.append({
                                "position": result_data.position,
                                "wallet": owner_wallet,
                                "amount": reward,
                                "tx_signature": tx_signature
                            })

                            logger.info(f"Prize transferred successfully: {tx_signature[:16]}...")

                            position_text = {1: "1st", 2: "2nd", 3: "3rd"}.get(result_data.position, f"{result_data.position}th")
                            await notification_repo.create(
                                user_id=horse.owner.id,
                                notification_type=NotificationType.RACE_WIN,
                                title=f"🏆 {position_text} Place - {horse.name}!",
                                message=f"Your horse {horse.name} finished in {position_text} place and won {reward} SOL!",
                                race_id=command.race_id,
                                horse_id=horse.id,
                                amount_sol=reward,
                                transaction_signature=tx_signature
                            )

                        except Exception as e:
                            logger.error(f"Failed to transfer prize to {owner_wallet[:8]}...: {e}")
                            await db.rollback()
                            from app.core.exceptions import PaymentError
                            raise PaymentError(f"Failed to distribute prizes: {str(e)}")

        await self._grant_consolation_goodluck_charm(
            db=db,
            race=race,
            race_results=race_results,
            notification_repo=notification_repo
        )

        race.status = RaceStatus.done
        await db.commit()

        logger.info(f"Race {command.race_id} ended successfully. Distributed {len(transferred_rewards)} prizes.")

        return RaceEndedResult(
            race_id=command.race_id,
            prize_pool=race.prize_pool_sol,
            rewards_distributed=transferred_rewards
        )