from typing import Optional
from pydantic import BaseModel, ConfigDict


class JenkinsBuildBase(BaseModel):
    job_name: str
    build_number: int
    branch: str = "main"
    commit_sha: Optional[str] = None
    status: str = "SUCCESS"
    trigger_cause: str = "Webhook / SCM Trigger"
    duration_ms: int = 0
    build_url: Optional[str] = None
    artifact_paths: Optional[str] = None
    repository_id: Optional[str] = None
    deployment_id: Optional[str] = None
    triggered_by_id: Optional[str] = None


class JenkinsBuildCreate(JenkinsBuildBase):
    """Schema for recording a new Jenkins build execution."""
    pass


class JenkinsBuildRead(JenkinsBuildBase):
    """Schema for reading a Jenkins build record from the database."""
    id: str
    model_config = ConfigDict(from_attributes=True)
