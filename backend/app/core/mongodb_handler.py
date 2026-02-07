
import asyncio
import logging
import traceback
from datetime import datetime
from typing import Optional

from pymongo.errors import PyMongoError


class MongoDBHandler(logging.Handler):


    def __init__(self, logging_service_getter):

        super().__init__()
        self.logging_service_getter = logging_service_getter
        self.setLevel(logging.ERROR)

    def emit(self, record: logging.LogRecord):

        try:
            logging_service = self.logging_service_getter()
            if not logging_service or not logging_service.enabled:
                return

            error_type = "PythonError"
            error_message = self.format(record)
            stack_trace = ""

            if record.exc_info:
                error_type = record.exc_info[0].__name__ if record.exc_info[0] else "Exception"
                stack_trace = "".join(traceback.format_exception(*record.exc_info))
            elif hasattr(record, "stack_info") and record.stack_info:
                stack_trace = record.stack_info

            severity = "ERROR"
            if record.levelno >= logging.CRITICAL:
                severity = "CRITICAL"
            elif record.levelno >= logging.ERROR:
                severity = "ERROR"
            elif record.levelno >= logging.WARNING:
                severity = "WARNING"

            additional_context = {
                "logger_name": record.name,
                "function": record.funcName,
                "line_number": record.lineno,
                "filename": record.filename,
                "pathname": record.pathname,
            }

            if hasattr(record, "metadata"):
                additional_context["metadata"] = record.metadata

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(
                        logging_service.log_error(
                            error_type=error_type,
                            error_message=error_message,
                            stack_trace=stack_trace,
                            severity=severity,
                            additional_context=additional_context,
                        )
                    )
            except RuntimeError:
                pass

        except Exception:
            self.handleError(record)