
import asyncio
import logging
from datetime import datetime

from app.core.config import settings
from app.core.logging_config import add_mongodb_handler, setup_logging
from app.services.logging_service import logging_service

setup_logging()
logger = logging.getLogger(__name__)


async def test_error_logging():

    if not settings.MONGODB_URL:
        return


    await logging_service.initialize()

    if not logging_service.enabled:
        return


    add_mongodb_handler()

    try:
        raise ValueError("Test error - this is intentional for testing")
    except ValueError as e:
        logger.error("Test error occurred", exc_info=True)

    await logging_service.log_error(
        error_type="TestError",
        error_message="Direct test error via logging_service",
        stack_trace="Test stack trace\nLine 1\nLine 2",
        severity="ERROR",
        endpoint="/test/endpoint",
        method="GET",
        additional_context={
            "test_field": "test_value",
            "timestamp_test": str(datetime.utcnow()),
        },
    )

    await asyncio.sleep(2)

    errors = await logging_service.get_error_logs(limit=10, hours=1)

    if errors:
        recent = errors[0]
        if recent.get('endpoint'):
    else:

    await logging_service.close()



if __name__ == "__main__":
    asyncio.run(test_error_logging())
