from typing import Any, Dict, List
from app.utils.logger import get_logger

logger = get_logger(__name__)


class DockerClient:
    """Client interface for Docker engine container management & statistics."""

    async def list_containers(self, all_containers: bool = False) -> List[Dict[str, Any]]:
        logger.info("docker_list_containers_requested")
        return [
            {
                "id": "c1a2b3c4d5e6",
                "names": ["/api_service_container"],
                "image": "devops-copilot-api:v1.0",
                "state": "running",
                "status": "Up 4 hours (healthy)",
            }
        ]

    async def get_container_stats(self, container_id: str) -> Dict[str, Any]:
        logger.info("docker_container_stats_requested", container_id=container_id)
        return {
            "container_id": container_id,
            "cpu_percent": 12.4,
            "memory_usage_mb": 142.8,
            "memory_limit_mb": 512.0,
        }
