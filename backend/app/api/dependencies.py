
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.horse.buy_horse_use_case import BuyHorseUseCase
from app.application.horse.feed_horse_use_case import FeedHorseUseCase
from app.application.horse.rest_horse_use_case import RestHorseUseCase
from app.application.horse.train_horse_use_case import TrainHorseUseCase
from app.application.race.join_race_use_case import JoinRaceUseCase
from app.application.race.start_race_use_case import StartRaceUseCase
from app.application.race.end_race_use_case import EndRaceUseCase
from app.core.exceptions import AuthenticationError, to_http_exception
from app.core.logging_config import get_logger
from app.core.security import decode_access_token
from app.db.base import get_db
from app.models.user import User
from app.services.notification_service import NotificationService
from app.services.solana_service import SolanaService
from app.services.transaction_verification_service import TransactionVerificationService

logger = get_logger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:

    try:
        token = access_token

        if not token and credentials:
            token = credentials.credentials

        if not token:
            raise AuthenticationError("No authentication token provided")

        payload = decode_access_token(token)

        if payload is None:
            raise AuthenticationError("Invalid authentication credentials")

        wallet_address: Optional[str] = payload.get("sub")
        if wallet_address is None:
            raise AuthenticationError("Invalid authentication credentials")

        result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = result.scalar_one_or_none()

        if user is None:
            raise AuthenticationError("User not found")

        logger.debug(f"Authenticated user: {wallet_address}")
        return user

    except AuthenticationError as e:
        raise to_http_exception(e)
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:

    token = access_token

    if not token and credentials:
        token = credentials.credentials

    if not token:
        return None

    try:
        payload = decode_access_token(token)

        if payload is None:
            return None

        wallet_address: Optional[str] = payload.get("sub")
        if wallet_address is None:
            return None

        result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        user = result.scalar_one_or_none()

        if user:
            logger.debug(f"Authenticated user: {wallet_address}")

        return user

    except Exception as e:
        logger.debug(f"Optional authentication failed: {e}")
        return None


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:

    if not current_user.is_admin:
        logger.warning(
            f"Non-admin user {current_user.id} ({current_user.wallet_address}) "
            "attempted to access admin endpoint"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    logger.debug(f"Admin user verified: {current_user.wallet_address}")
    return current_user


def get_buy_horse_use_case() -> BuyHorseUseCase:

    return BuyHorseUseCase(
        notification_service=NotificationService(),
        transaction_verifier=TransactionVerificationService(),
        solana_service=SolanaService()
    )


def get_join_race_use_case() -> JoinRaceUseCase:

    return JoinRaceUseCase(
        notification_service=NotificationService(),
        transaction_verifier=TransactionVerificationService()
    )


def get_feed_horse_use_case() -> FeedHorseUseCase:

    return FeedHorseUseCase(
        transaction_verifier=TransactionVerificationService()
    )


def get_rest_horse_use_case() -> RestHorseUseCase:

    return RestHorseUseCase(
        transaction_verifier=TransactionVerificationService()
    )


def get_train_horse_use_case() -> TrainHorseUseCase:

    return TrainHorseUseCase(
        transaction_verifier=TransactionVerificationService()
    )


def get_start_race_use_case() -> StartRaceUseCase:

    return StartRaceUseCase()


def get_end_race_use_case() -> EndRaceUseCase:

    return EndRaceUseCase()