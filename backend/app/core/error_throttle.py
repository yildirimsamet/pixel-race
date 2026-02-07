
import hashlib
import threading
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Optional

from app.core.config import settings


@dataclass
class ErrorStats:

    count: int
    first_seen: float
    last_seen: float
    suppressed_count: int


class ErrorThrottle:


    def __init__(self):
        self.lock = threading.Lock()

        self.error_cache: Dict[str, ErrorStats] = {}

        self.type_cache: Dict[str, int] = {}

        self.global_count = 0
        self.window_start = time.time()
        self.total_suppressed = 0
        self.last_stats_report = time.time()

        self.sampling_mode = False
        self.sample_counter = 0

        self.max_errors_per_minute = settings.LOG_MAX_ERRORS_PER_MINUTE
        self.dedupe_window = settings.LOG_DEDUPE_WINDOW_SECONDS
        self.sampling_rate = settings.LOG_SAMPLING_RATE
        self.max_per_type = settings.LOG_MAX_PER_ERROR_TYPE

    def _get_error_signature(self, error_type: str, error_message: str) -> str:

        combined = f"{error_type}:{error_message[:200]}"
        return hashlib.md5(combined.encode()).hexdigest()

    def _cleanup_old_entries(self):

        current_time = time.time()
        cutoff_time = current_time - self.dedupe_window

        expired_signatures = [
            sig for sig, stats in self.error_cache.items()
            if stats.last_seen < cutoff_time
        ]
        for sig in expired_signatures:
            del self.error_cache[sig]

        if current_time - self.window_start >= 60:
            self.global_count = 0
            self.type_cache.clear()
            self.window_start = current_time

            if self.total_suppressed > 0:
                self._report_stats()
                self.total_suppressed = 0

            if self.sampling_mode:
                self.sampling_mode = False
                self.sample_counter = 0

    def _report_stats(self):

        current_time = time.time()
        if current_time - self.last_stats_report < 60:
            return

        if self.total_suppressed > 0:
            from app.core.logging_config import get_logger
            logger = get_logger(__name__)
            logger.warning(
                f"Error throttling active: Suppressed {self.total_suppressed} duplicate errors in last minute"
            )

        self.last_stats_report = current_time

    def should_log(
        self,
        error_type: str,
        error_message: str,
        severity: str = "ERROR"
    ) -> bool:

        if severity == "CRITICAL":
            return True

        with self.lock:
            self._cleanup_old_entries()

            current_time = time.time()
            signature = self._get_error_signature(error_type, error_message)

            if self.global_count >= self.max_errors_per_minute:
                self.total_suppressed += 1

                if not self.sampling_mode:
                    self.sampling_mode = True
                    from app.core.logging_config import get_logger
                    logger = get_logger(__name__)
                    logger.warning(
                        f"Error storm detected: Entering sampling mode (1 in {self.sampling_rate})"
                    )

                self.sample_counter += 1
                if self.sample_counter % self.sampling_rate != 0:
                    return False

            type_count = self.type_cache.get(error_type, 0)
            if type_count >= self.max_per_type:
                self.total_suppressed += 1
                return False

            if signature in self.error_cache:
                stats = self.error_cache[signature]
                time_since_first = current_time - stats.first_seen

                if time_since_first < self.dedupe_window:
                    stats.count += 1
                    stats.last_seen = current_time
                    stats.suppressed_count += 1
                    self.total_suppressed += 1
                    return False
                else:
                    stats.count = 1
                    stats.first_seen = current_time
                    stats.last_seen = current_time
                    stats.suppressed_count = 0
            else:
                self.error_cache[signature] = ErrorStats(
                    count=1,
                    first_seen=current_time,
                    last_seen=current_time,
                    suppressed_count=0
                )

            self.global_count += 1
            self.type_cache[error_type] = type_count + 1

            return True

    def get_stats(self) -> Dict[str, any]:

        with self.lock:
            return {
                "global_count": self.global_count,
                "total_suppressed": self.total_suppressed,
                "sampling_mode": self.sampling_mode,
                "unique_errors": len(self.error_cache),
                "error_types": len(self.type_cache),
                "window_start": self.window_start,
            }


error_throttle = ErrorThrottle()