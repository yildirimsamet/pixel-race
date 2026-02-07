
import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class LogLevel:

    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    DEBUG = "DEBUG"


class LogAction:

    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    BUY_HORSE = "BUY_HORSE"
    JOIN_RACE = "JOIN_RACE"
    RACE_START = "RACE_START"
    RACE_END = "RACE_END"
    MINT_NFT = "MINT_NFT"
    TRANSFER_SOL = "TRANSFER_SOL"
    VERIFY_TX = "VERIFY_TX"
    FEED_HORSE = "FEED_HORSE"
    REST_HORSE = "REST_HORSE"
    TRAIN_HORSE = "TRAIN_HORSE"
    SUBMIT_FEEDBACK = "SUBMIT_FEEDBACK"


class LogStep:

    START = "START"
    VERIFY_TX = "VERIFY_TX"
    MINT_NFT = "MINT_NFT"
    CREATE_RECORD = "CREATE_RECORD"
    TRANSFER_SOL = "TRANSFER_SOL"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    VALIDATION = "VALIDATION"


class LoggingService:


    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.collection_name = "action_logs"
        self.error_collection_name = "error_logs"
        self.enabled = False

    async def initialize(self):

        if not settings.MONGODB_URL:
            logger.warning("MONGODB_URL not set - logging to console only")
            return

        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client.pixel_race_logs

            await self.client.admin.command('ping')

            collection = self.db[self.collection_name]
            await collection.create_indexes([
                IndexModel([("user_id", ASCENDING)]),
                IndexModel([("wallet_address", ASCENDING)]),
                IndexModel([("timestamp", DESCENDING)]),
                IndexModel([("request_id", ASCENDING)]),
                IndexModel([("action", ASCENDING), ("level", ASCENDING)]),
                IndexModel([("level", ASCENDING), ("timestamp", DESCENDING)]),
            ])

            error_collection = self.db[self.error_collection_name]
            await error_collection.create_indexes([
                IndexModel([("timestamp", DESCENDING)]),
                IndexModel([("error_type", ASCENDING)]),
                IndexModel([("user_id", ASCENDING)]),
                IndexModel([("request_id", ASCENDING)]),
                IndexModel([("endpoint", ASCENDING)]),
                IndexModel([("severity", ASCENDING), ("timestamp", DESCENDING)]),
            ])

            self.enabled = True
            logger.info("MongoDB logging service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize MongoDB logging: {e}")
            self.enabled = False

    async def close(self):

        if self.client:
            self.client.close()
            logger.info("MongoDB logging service closed")

    async def _write_to_mongodb(self, log_entry: dict):

        try:
            collection = self.db[self.collection_name]
            await collection.insert_one(log_entry)
        except PyMongoError as e:
            logger.error(f"Failed to write to MongoDB: {e}")

    async def log_action(
        self,
        user_id: Optional[UUID],
        action: str,
        step: str,
        level: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[UUID] = None,
        wallet_address: Optional[str] = None,
    ) -> bool:

        log_entry = {
            "user_id": str(user_id) if user_id else None,
            "wallet_address": wallet_address,
            "action": action,
            "step": step,
            "level": level,
            "message": message,
            "metadata": metadata or {},
            "request_id": str(request_id) if request_id else None,
            "timestamp": datetime.utcnow(),
        }

        log_msg = f"[{level}] {action}.{step}: {message}"
        if level == LogLevel.ERROR:
            logger.error(log_msg, extra={"metadata": metadata})
        elif level == LogLevel.WARNING:
            logger.warning(log_msg, extra={"metadata": metadata})

        if self.enabled and self.db is not None:
            asyncio.create_task(self._write_to_mongodb(log_entry))
            return True

        return False

    async def get_user_logs(
        self,
        user_id: UUID,
        limit: int = 100,
        action_filter: Optional[str] = None,
        level_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:

        if not self.enabled or self.db is None:
            return []

        try:
            collection = self.db[self.collection_name]
            query = {"user_id": str(user_id)}

            if action_filter:
                query["action"] = action_filter
            if level_filter:
                query["level"] = level_filter

            cursor = collection.find(query).sort("timestamp", DESCENDING).limit(limit)
            logs = await cursor.to_list(length=limit)

            for log in logs:
                log["_id"] = str(log["_id"])

            return logs

        except PyMongoError as e:
            logger.error(f"Failed to fetch user logs: {e}")
            return []

    async def get_logs_by_request_id(
        self,
        request_id: UUID,
    ) -> List[Dict[str, Any]]:

        if not self.enabled or self.db is None:
            return []

        try:
            collection = self.db[self.collection_name]
            cursor = collection.find({"request_id": str(request_id)}).sort("timestamp", ASCENDING)
            logs = await cursor.to_list(length=None)

            for log in logs:
                log["_id"] = str(log["_id"])

            return logs

        except PyMongoError as e:
            logger.error(f"Failed to fetch request logs: {e}")
            return []

    async def get_recent_errors(
        self,
        limit: int = 50,
        hours: int = 24,
    ) -> List[Dict[str, Any]]:

        if not self.enabled or self.db is None:
            return []

        try:
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=hours)

            collection = self.db[self.collection_name]
            cursor = collection.find({
                "level": LogLevel.ERROR,
                "timestamp": {"$gte": cutoff}
            }).sort("timestamp", DESCENDING).limit(limit)

            logs = await cursor.to_list(length=limit)

            for log in logs:
                log["_id"] = str(log["_id"])

            return logs

        except PyMongoError as e:
            logger.error(f"Failed to fetch error logs: {e}")
            return []

    async def get_action_stats(
        self,
        action: str,
        hours: int = 24,
    ) -> Dict[str, Any]:

        if not self.enabled or self.db is None:
            return {}

        try:
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=hours)

            collection = self.db[self.collection_name]

            total = await collection.count_documents({
                "action": action,
                "timestamp": {"$gte": cutoff}
            })

            success = await collection.count_documents({
                "action": action,
                "step": LogStep.SUCCESS,
                "timestamp": {"$gte": cutoff}
            })

            errors = await collection.count_documents({
                "action": action,
                "level": LogLevel.ERROR,
                "timestamp": {"$gte": cutoff}
            })

            success_rate = (success / total * 100) if total > 0 else 0

            return {
                "action": action,
                "total_attempts": total,
                "successful": success,
                "errors": errors,
                "success_rate": round(success_rate, 2),
                "period_hours": hours,
            }

        except PyMongoError as e:
            logger.error(f"Failed to fetch action stats: {e}")
            return {}

    async def log_error(
        self,
        error_type: str,
        error_message: str,
        stack_trace: str,
        severity: str = "ERROR",
        user_id: Optional[UUID] = None,
        wallet_address: Optional[str] = None,
        request_id: Optional[UUID] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        request_data: Optional[Dict[str, Any]] = None,
        additional_context: Optional[Dict[str, Any]] = None,
    ) -> bool:

        from app.core.error_throttle import error_throttle

        if not error_throttle.should_log(error_type, error_message, severity):
            return False

        error_entry = {
            "error_type": error_type,
            "error_message": error_message,
            "stack_trace": stack_trace,
            "severity": severity,
            "user_id": str(user_id) if user_id else None,
            "wallet_address": wallet_address,
            "request_id": str(request_id) if request_id else None,
            "endpoint": endpoint,
            "method": method,
            "request_data": request_data or {},
            "additional_context": additional_context or {},
            "timestamp": datetime.utcnow(),
        }

        if self.enabled and self.db is not None:
            try:
                error_collection = self.db[self.error_collection_name]
                asyncio.create_task(self._insert_error_background(error_collection, error_entry))
                return True
            except Exception as e:
                logger.error(f"Failed to schedule error write to MongoDB: {e}")
                return False

        return False

    async def _insert_error_background(self, collection, error_entry: dict):

        try:
            await collection.insert_one(error_entry)
        except PyMongoError as e:
            logger.error(f"Failed to write error to MongoDB in background: {e}")

    async def get_error_logs(
        self,
        limit: int = 100,
        severity_filter: Optional[str] = None,
        error_type_filter: Optional[str] = None,
        hours: int = 24,
    ) -> List[Dict[str, Any]]:

        if not self.enabled or self.db is None:
            return []

        try:
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=hours)

            error_collection = self.db[self.error_collection_name]
            query = {"timestamp": {"$gte": cutoff}}

            if severity_filter:
                query["severity"] = severity_filter
            if error_type_filter:
                query["error_type"] = error_type_filter

            cursor = error_collection.find(query).sort("timestamp", DESCENDING).limit(limit)
            errors = await cursor.to_list(length=limit)

            for error in errors:
                error["_id"] = str(error["_id"])

            return errors

        except PyMongoError as e:
            logger.error(f"Failed to fetch error logs: {e}")
            return []

    def get_throttle_stats(self) -> Dict[str, Any]:

        from app.core.error_throttle import error_throttle
        return error_throttle.get_stats()


logging_service = LoggingService()