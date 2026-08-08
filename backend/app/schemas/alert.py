from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    title: str = Field(..., example="CPU Cluster Usage > 90%")
    severity: str = Field("HIGH", example="CRITICAL")
    node: str = Field(..., example="k8s-node-04")
    description: str = Field(..., example="High CPU usage detected on primary web ingress pool.")


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(None, example="RESOLVED")


class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    created_at: datetime
    updated_at: datetime
