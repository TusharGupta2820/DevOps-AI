from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_any_authenticated, require_devops_or_admin
from app.database.session import get_db
from app.repositories.deployment import DeploymentRepository
from app.schemas.common import GenericResponse, PaginatedResponse
from app.schemas.deployment import DeploymentCreate, DeploymentRead, DeploymentUpdate
from app.services.deployment import DeploymentService

router = APIRouter(prefix="/deployments", tags=["Deployments"])


def get_deployment_service(db: AsyncSession = Depends(get_db)) -> DeploymentService:
    repository = DeploymentRepository(db)
    return DeploymentService(repository)


@router.get("", response_model=PaginatedResponse[DeploymentRead])
async def list_deployments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_any_authenticated),
    service: DeploymentService = Depends(get_deployment_service),
):
    """Retrieve paginated deployments stream (Protected: Admin, DevOps Engineer, Viewer)."""
    items = await service.list_deployments(page=page, size=size)
    total = await service.get_total_count()
    pages = (total + size - 1) // size if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{deployment_id}", response_model=GenericResponse[DeploymentRead])
async def get_deployment(
    deployment_id: str,
    current_user: dict = Depends(require_any_authenticated),
    service: DeploymentService = Depends(get_deployment_service),
):
    """Fetch single deployment details by ID (Protected)."""
    data = await service.get_deployment_by_id(deployment_id)
    return GenericResponse(data=data)


@router.post("", response_model=GenericResponse[DeploymentRead], status_code=status.HTTP_201_CREATED)
async def create_deployment(
    payload: DeploymentCreate,
    current_user: dict = Depends(require_devops_or_admin),
    service: DeploymentService = Depends(get_deployment_service),
):
    """Trigger or record a new deployment execution (Protected: Admin or DevOps Engineer)."""
    data = await service.create_deployment(payload)
    return GenericResponse(message="Deployment created successfully", data=data)


@router.patch("/{deployment_id}", response_model=GenericResponse[DeploymentRead])
async def update_deployment_status(
    deployment_id: str,
    payload: DeploymentUpdate,
    current_user: dict = Depends(require_devops_or_admin),
    service: DeploymentService = Depends(get_deployment_service),
):
    """Update active deployment status or append logs URL (Protected: Admin or DevOps Engineer)."""
    data = await service.update_deployment_status(deployment_id, payload)
    return GenericResponse(message="Deployment status updated", data=data)
