from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.core.logging_config import get_logger
from app.services.solana_service import SolanaService
from app.services.transaction_tracker import transaction_tracker

logger = get_logger(__name__)


class TransactionVerificationService:


    def __init__(self):
        self.solana_service = SolanaService()

    async def verify_payment_transaction(
        self,
        db: AsyncSession,
        from_wallet: str,
        transaction_signature: str,
        expected_amount_sol: float,
        tolerance_sol: float = 0.005
    ) -> None:

        treasury_wallet = settings.TREASURY_WALLET_ADDRESS
        if not treasury_wallet:
            logger.error("TREASURY_WALLET_ADDRESS not configured in environment")
            raise ValidationError("Treasury wallet not configured")

        from sqlalchemy import select, or_
        from app.models.horse import Horse
        from app.models.race import RaceResult

        result = await db.execute(
            select(Horse).where(Horse.purchase_tx_signature == transaction_signature)
        )
        if result.scalar_one_or_none():
            logger.warning(
                f"Transaction replay attack detected: signature {transaction_signature[:16]}... "
                f"already used for horse purchase"
            )
            raise ValidationError(
                "This transaction has already been used for a horse purchase. Please create a new transaction.",
                details={"transaction_signature": transaction_signature}
            )

        result = await db.execute(
            select(RaceResult).where(RaceResult.entry_tx_signature == transaction_signature)
        )
        if result.scalar_one_or_none():
            logger.warning(
                f"Transaction replay attack detected: signature {transaction_signature[:16]}... "
                f"already used for race entry"
            )
            raise ValidationError(
                "This transaction has already been used for a race entry. Please create a new transaction.",
                details={"transaction_signature": transaction_signature}
            )

        if await transaction_tracker.is_transaction_used(db, transaction_signature):
            logger.warning(
                f"Transaction replay attack detected: signature {transaction_signature[:16]}... "
                f"already used by wallet {from_wallet[:8]}..."
            )
            raise ValidationError(
                "This transaction has already been processed. Please create a new transaction.",
                details={"field": "transaction_signature"}
            )

        is_valid = await self.solana_service.verify_transaction(
            tx_signature=transaction_signature,
            from_wallet=from_wallet,
            to_wallet=treasury_wallet,
            expected_amount_sol=expected_amount_sol,
            tolerance_sol=tolerance_sol
        )

        if not is_valid:
            logger.warning(
                f"Invalid payment transaction from wallet {from_wallet[:8]}...: "
                f"signature={transaction_signature[:16]}..."
            )
            raise ValidationError(
                "Payment transaction verification failed. Please ensure you sent the correct amount to the treasury.",
                details={
                    "required_amount": expected_amount_sol,
                    "treasury_wallet": treasury_wallet
                }
            )

        logger.info(
            f"Payment verified: {expected_amount_sol} SOL from {from_wallet[:8]}... "
            f"(tx: {transaction_signature[:16]}...)"
        )