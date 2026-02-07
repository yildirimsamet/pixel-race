
from typing import Any, Optional
from fastapi import HTTPException, status


class PixelRaceException(Exception):


    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(PixelRaceException):


    def __init__(
        self, message: str = "Authentication failed", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class AuthorizationError(PixelRaceException):


    def __init__(
        self,
        message: str = "Not authorized to perform this action",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class ValidationError(PixelRaceException):


    def __init__(
        self, message: str = "Validation failed", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class NotFoundError(PixelRaceException):


    def __init__(
        self, resource: str = "Resource", details: Optional[dict[str, Any]] = None
    ):
        message = f"{resource} not found"
        super().__init__(message, details)


class InsufficientFundsError(PixelRaceException):


    def __init__(
        self,
        required: float,
        available: float,
        currency: str = "SOL",
        details: Optional[dict[str, Any]] = None,
    ):
        message = f"Insufficient {currency}. Required: {required}, Available: {available}"
        details = details or {}
        details.update(
            {"required": required, "available": available, "currency": currency}
        )
        super().__init__(message, details)


class HorseUnavailableError(PixelRaceException):


    def __init__(
        self, message: str = "Horse is unavailable", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class RaceFullError(PixelRaceException):


    def __init__(
        self, message: str = "Race is full", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class RaceNotAvailableError(PixelRaceException):


    def __init__(
        self,
        message: str = "Race is not available",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class BlockchainError(PixelRaceException):


    def __init__(
        self,
        message: str = "Blockchain operation failed",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class PaymentError(BlockchainError):


    def __init__(
        self, message: str = "Payment operation failed", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class NFTMintError(BlockchainError):


    def __init__(
        self, message: str = "NFT minting failed", details: Optional[dict[str, Any]] = None
    ):
        super().__init__(message, details)


class DatabaseError(PixelRaceException):


    def __init__(
        self,
        message: str = "Database operation failed",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class ConfigurationError(PixelRaceException):


    def __init__(
        self,
        message: str = "Configuration error",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(message, details)


def to_http_exception(exc: PixelRaceException) -> HTTPException:

    status_mapping = {
        AuthenticationError: status.HTTP_401_UNAUTHORIZED,
        AuthorizationError: status.HTTP_403_FORBIDDEN,
        ValidationError: status.HTTP_400_BAD_REQUEST,
        NotFoundError: status.HTTP_404_NOT_FOUND,
        InsufficientFundsError: status.HTTP_400_BAD_REQUEST,
        HorseUnavailableError: status.HTTP_409_CONFLICT,
        RaceFullError: status.HTTP_409_CONFLICT,
        RaceNotAvailableError: status.HTTP_409_CONFLICT,
        BlockchainError: status.HTTP_503_SERVICE_UNAVAILABLE,
        PaymentError: status.HTTP_503_SERVICE_UNAVAILABLE,
        NFTMintError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        DatabaseError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        ConfigurationError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    }

    status_code = status_mapping.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)

    detail = {"message": exc.message}
    if exc.details:
        detail["details"] = exc.details

    return HTTPException(status_code=status_code, detail=detail)