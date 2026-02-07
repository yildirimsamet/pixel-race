
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings
from app.core.logging_config import get_logger
from app.services.solana_service import SolanaService

logger = get_logger(__name__)


class TreasuryMonitor:


    def __init__(self):
        self.solana_service = SolanaService()
        self.min_balance = settings.MIN_TREASURY_BALANCE
        self.last_alert_time: Optional[datetime] = None
        self.alert_cooldown_minutes = 60  # Don't spam alerts

    async def check_balance(self) -> tuple[float, bool]:

        try:
            if self.solana_service.network == "devnet":
                logger.debug("Skipping treasury balance check on devnet (free RPC limitation)")
                return 999.0, False

            if not self.solana_service.treasury:
                logger.error("Treasury wallet not configured")
                return 0.0, True

            treasury_address = str(self.solana_service.treasury.pubkey())
            balance = self.solana_service.get_wallet_balance(treasury_address)

            is_low = balance < self.min_balance

            if is_low:
                await self._alert_low_balance(balance)

            return balance, is_low

        except Exception as e:
            logger.error(f"Error checking treasury balance: {e}")
            if "freetier" in str(e).lower() or "not available" in str(e).lower():
                logger.warning("Treasury balance check skipped due to RPC limitation (upgrade to paid tier for production)")
                return 999.0, False
            return 0.0, True

    async def _alert_low_balance(self, current_balance: float):

        if self.last_alert_time:
            time_since_last_alert = datetime.utcnow() - self.last_alert_time
            if time_since_last_alert < timedelta(minutes=self.alert_cooldown_minutes):
                return

        logger.critical(
            f"🚨 TREASURY BALANCE LOW! Current: {current_balance:.4f} SOL, "
            f"Minimum: {self.min_balance:.4f} SOL"
        )


        self.last_alert_time = datetime.utcnow()

    async def get_balance_status(self) -> dict:

        balance, is_low = await self.check_balance()

        treasury_address = str(self.solana_service.treasury.pubkey()) if self.solana_service.treasury else "N/A"

        return {
            "treasury_address": treasury_address,
            "current_balance_sol": round(balance, 4),
            "min_balance_threshold_sol": self.min_balance,
            "is_below_threshold": is_low,
            "balance_percentage": round((balance / self.min_balance * 100), 2) if self.min_balance > 0 else 0,
            "network": self.solana_service.network,
            "last_checked": datetime.utcnow().isoformat()
        }


treasury_monitor = TreasuryMonitor()