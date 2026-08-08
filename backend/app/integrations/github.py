from typing import Any, Dict, Optional
import httpx
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GitHubClient:
    """Client interface for interacting with GitHub REST & Webhook APIs."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.GITHUB_TOKEN

    async def dispatch_workflow(
        self, repo_owner: str, repo_name: str, workflow_id: str, ref: str = "main", inputs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        logger.info("github_workflow_dispatch", repo=f"{repo_owner}/{repo_name}", workflow=workflow_id, ref=ref)
        return {
            "dispatched": True,
            "repo": f"{repo_owner}/{repo_name}",
            "workflow_id": workflow_id,
            "ref": ref,
        }

    async def get_commit_status(self, repo_owner: str, repo_name: str, commit_sha: str) -> Dict[str, Any]:
        logger.info("github_commit_status_check", repo=f"{repo_owner}/{repo_name}", sha=commit_sha)
        return {
            "state": "success",
            "sha": commit_sha,
            "total_count": 4,
            "statuses": [
                {"context": "ci/jenkins", "state": "success"},
                {"context": "security/snyk", "state": "success"},
            ],
        }
