from typing import Dict, Optional
from pydantic import BaseModel, Field


class ServiceHealth(BaseModel):
    status: str = Field(..., example="healthy")
    latency_ms: Optional[float] = Field(None, example=1.25)


class DetailedHealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="1.0.0")
    environment: str = Field(..., example="development")
    services: Dict[str, ServiceHealth]


class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
