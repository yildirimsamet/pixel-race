
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):


    DATABASE_URL: str = Field(
        ..., description="PostgreSQL database URL (postgresql://...)"
    )
    MONGODB_URL: Optional[str] = Field(
        default=None, description="MongoDB connection URL for logging (optional)"
    )

    SECRET_KEY: str = Field(..., min_length=32, description="Secret key for JWT tokens")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=43200, ge=1, description="Access token expiration in minutes"
    )

    SOCKET_SERVER_URL: str = Field(..., description="WebSocket server URL")

    RACE_CREATE_INTERVAL_MINUTES: int = Field(
        default=3, ge=1, description="DEPRECATED: Use game_config.get_race_create_interval()"
    )
    RACE_START_DELAY_MINUTES: int = Field(
        default=3, ge=1, description="DEPRECATED: Use game_config.get_race_start_delay()"
    )

    SOLANA_RPC_URL: Optional[str] = Field(
        default=None, description="Solana RPC endpoint URL"
    )
    SOLANA_NETWORK: str = Field(default="devnet", description="Solana network")
    SOLANA_PRIVATE_KEY: Optional[str] = Field(
        default=None, description="Solana wallet private key for NFT minting"
    )
    SOLANA_PRIORITY_FEE_MICROLAMPORTS: int = Field(
        default=1000, ge=0, description="Priority fee in micro-lamports per compute unit"
    )
    TREASURY_WALLET_ADDRESS: Optional[str] = Field(
        default=None, description="Treasury wallet public key for receiving payments"
    )

    MIN_TREASURY_BALANCE: float = Field(
        default=10.0, ge=0, description="Minimum treasury balance threshold for alerts (SOL)"
    )
    TREASURY_LOW_BALANCE_THRESHOLD: float = Field(
        default=0.08, ge=0, description="Treasury balance threshold for bot speed boost activation (SOL)"
    )

    RATE_LIMIT_ENABLED: bool = Field(
        default=True, description="Enable rate limiting"
    )
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=10, ge=1, description="Maximum requests per minute per user"
    )

    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_MAX_ERRORS_PER_MINUTE: int = Field(
        default=100, ge=1, description="Maximum errors logged to MongoDB per minute"
    )
    LOG_DEDUPE_WINDOW_SECONDS: int = Field(
        default=60, ge=1, description="Deduplication time window in seconds"
    )
    LOG_SAMPLING_RATE: int = Field(
        default=10, ge=1, description="Sample rate when error storm detected (1 in N)"
    )
    LOG_MAX_PER_ERROR_TYPE: int = Field(
        default=10, ge=1, description="Maximum logs per error type per minute"
    )

    HORSE_PRICE_LEVEL_1: float = Field(
        default=0.01, ge=0, description="DEPRECATED: Use game_config.get_horse_price(1)"
    )
    HORSE_PRICE_LEVEL_2: float = Field(
        default=0.02, ge=0, description="DEPRECATED: Use game_config.get_horse_price(2)"
    )
    HORSE_PRICE_LEVEL_3: float = Field(
        default=0.03, ge=0, description="DEPRECATED: Use game_config.get_horse_price(3)"
    )
    GOODLUCK_PRICE: float = Field(
        default=0.005, ge=0, description="DEPRECATED: Use game_config.get_goodluck_price()"
    )

    ENVIRONMENT: str = Field(
        default="development", description="Environment (development/production)"
    )

    BOT_WALLET_1: Optional[str] = Field(
        default=None, description="Bot wallet address 1"
    )
    BOT_WALLET_2: Optional[str] = Field(
        default=None, description="Bot wallet address 2"
    )
    BOT_WALLET_3: Optional[str] = Field(
        default=None, description="Bot wallet address 3"
    )
    BOT_WALLET_4: Optional[str] = Field(
        default=None, description="Bot wallet address 4"
    )
    BOT_WALLET_5: Optional[str] = Field(
        default=None, description="Bot wallet address 5"
    )
    BOT_WALLET_6: Optional[str] = Field(
        default=None, description="Bot wallet address 6"
    )

    BOOTSTRAP_ADMIN_WALLET: Optional[str] = Field(
        default=None, description="Wallet address to automatically set as admin on startup"
    )

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:

        if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:

        valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in valid_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_levels}")
        return v_upper


settings = Settings()