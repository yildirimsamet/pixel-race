
from datetime import datetime

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.logging_config import get_logger
from app.core.security import create_access_token, verify_solana_signature
from app.db.base import get_db
from app.models.user import User
from app.schemas import Token, WalletLogin
from app.services.logging_service import LogAction, LogLevel, LogStep, logging_service

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/wallet-login", response_model=Token, status_code=status.HTTP_200_OK)
async def wallet_login(
    request: Request,
    response: Response,
    wallet_data: WalletLogin,
    db: AsyncSession = Depends(get_db)
) -> Token:

    request_id = getattr(request.state, 'request_id', None)

    logger.info(f"Wallet login attempt: {wallet_data.wallet_address}")

    if not verify_solana_signature(
        wallet_data.wallet_address, wallet_data.message, wallet_data.signature
    ):
        logger.warning(f"Invalid signature for wallet: {wallet_data.wallet_address}")

        await logging_service.log_action(
            user_id=None,
            action=LogAction.LOGIN,
            step=LogStep.ERROR,
            level=LogLevel.ERROR,
            message="Signature verification failed",
            metadata={"wallet_address": wallet_data.wallet_address},
            request_id=request_id,
            wallet_address=wallet_data.wallet_address,
        )

        raise AuthenticationError("Invalid signature")

    result = await db.execute(
        select(User).where(User.wallet_address == wallet_data.wallet_address)
    )
    user = result.scalar_one_or_none()

    is_new_user = False
    if not user:
        user = User(
            wallet_address=wallet_data.wallet_address,
            wallet_connected_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        is_new_user = True
        logger.info(f"New user created: {user.id}")
    else:
        user.last_login = datetime.utcnow()
        await db.commit()
        logger.debug(f"User login updated: {user.id}")

    if (settings.BOOTSTRAP_ADMIN_WALLET and
        wallet_data.wallet_address == settings.BOOTSTRAP_ADMIN_WALLET and
        not user.is_admin):
        user.is_admin = True
        await db.commit()
        logger.info(f"Bootstrap admin privileges granted to wallet: {wallet_data.wallet_address}")


    access_token = create_access_token(data={"sub": user.wallet_address})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    logger.info(f"Successful login for wallet: {wallet_data.wallet_address}")

    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):

    response.delete_cookie(key="access_token", path="/")
    logger.info("User logged out successfully")
    return {"message": "Logged out successfully"}