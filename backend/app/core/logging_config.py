
import logging
import sys
from pathlib import Path
from typing import Optional

from app.core.config import settings

_mongodb_handler_added = False


def setup_logging(
    level: Optional[str] = None, log_file: Optional[str] = None
) -> logging.Logger:

    log_level = level or getattr(settings, "LOG_LEVEL", "INFO")
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return root_logger


def add_mongodb_handler():

    global _mongodb_handler_added

    if _mongodb_handler_added:
        return

    try:
        from app.core.mongodb_handler import MongoDBHandler
        from app.services.logging_service import logging_service

        mongodb_handler = MongoDBHandler(lambda: logging_service)
        mongodb_handler.setLevel(logging.ERROR)

        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        mongodb_handler.setFormatter(formatter)

        root_logger = logging.getLogger()
        root_logger.addHandler(mongodb_handler)

        _mongodb_handler_added = True
        root_logger.info("MongoDB error handler added to logging system")

    except Exception as e:
        logging.getLogger(__name__).warning(
            f"Failed to add MongoDB handler: {e}"
        )


def get_logger(name: str) -> logging.Logger:

    return logging.getLogger(name)