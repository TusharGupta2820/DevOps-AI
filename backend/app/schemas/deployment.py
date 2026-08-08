from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DeploymentBase(BaseModel):
    service_name: str = Field(..., min_length=2, max_length=100, example="auth-service")
    environment: str = Field("production", example="production")
    version: str = Field(..., example="v2.4.1")
    cluster: str = Field("us-east-cluster-01", example="us-east-cluster-01")
    commit_hash: str = Field(..., example="a1b2c3d4")
    author: str = Field(..., example="alex.devops@company.com")
    logs_url: Optional[str] = Field(None, example="https://logs.internal/deploy/123")


class DeploymentCreate(DeploymentBase):
    pass


class DeploymentUpdate(BaseModel):
    status: Optional[str] = Field(None, example="SUCCESS")
    logs_url: Optional[str] = None


class DeploymentRead(DeploymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    updated_at: datetime
