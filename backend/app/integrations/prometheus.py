from typing import Any, Dict, Optional
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PrometheusClient:
    """Client interface for querying Prometheus metrics & cluster telemetry."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.PROMETHEUS_URL

    async def query_promql(self, query: str) -> Dict[str, Any]:
        logger.info("prometheus_query_executed", promql=query)
        return {
            "status": "success",
            "data": {
                "resultType": "vector",
                "result": [
                    {
                        "metric": {"instance": "node-01:9100", "job": "node-exporter"},
                        "value": [1625097600, "42.5"],
                    }
                ],
            },
        }
