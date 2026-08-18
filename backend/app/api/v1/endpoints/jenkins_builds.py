from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_any_authenticated, require_devops_or_admin
from app.database.session import get_db
from app.repositories.jenkins_build import JenkinsBuildRepository
from app.schemas.common import GenericResponse, PaginatedResponse
from app.schemas.jenkins_build import JenkinsBuildCreate, JenkinsBuildRead

router = APIRouter(prefix="/jenkins-builds", tags=["Jenkins Builds"])


def get_repo(db: AsyncSession = Depends(get_db)) -> JenkinsBuildRepository:
    return JenkinsBuildRepository(db)


@router.get("", response_model=PaginatedResponse[JenkinsBuildRead])
async def list_jenkins_builds(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    job_name: Optional[str] = Query(None, description="Filter by Jenkins job name"),
    build_status: Optional[str] = Query(None, alias="status", description="Filter by status: SUCCESS, FAILURE, ABORTED"),
    current_user: dict = Depends(require_any_authenticated),
    repo: JenkinsBuildRepository = Depends(get_repo),
):
    """
    List Jenkins build execution records from the database.
    Supports filtering by job_name and build status.
    Protected: Any authenticated user (ADMIN, DEVOPS_ENGINEER, VIEWER).
    """
    if job_name:
        items = await repo.get_by_job_name(job_name=job_name, limit=size)
    elif build_status:
        items = await repo.get_by_status(status=build_status.upper(), limit=size)
    else:
        items = await repo.get_recent_builds(limit=size)

    total = await repo.count()
    pages = (total + size - 1) // size if total > 0 else 1

    return PaginatedResponse(
        items=[JenkinsBuildRead.model_validate(b) for b in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{build_id}", response_model=GenericResponse[JenkinsBuildRead])
async def get_jenkins_build(
    build_id: str,
    current_user: dict = Depends(require_any_authenticated),
    repo: JenkinsBuildRepository = Depends(get_repo),
):
    """
    Fetch a single Jenkins build record by database UUID.
    Protected: Any authenticated user.
    """
    from fastapi import HTTPException
    build = await repo.get(build_id)
    if not build:
        raise HTTPException(status_code=404, detail=f"Jenkins build {build_id} not found")
    return GenericResponse(data=JenkinsBuildRead.model_validate(build))


@router.post("", response_model=GenericResponse[JenkinsBuildRead], status_code=http_status.HTTP_201_CREATED)
async def record_jenkins_build(
    payload: JenkinsBuildCreate,
    current_user: dict = Depends(require_devops_or_admin),
    repo: JenkinsBuildRepository = Depends(get_repo),
):
    """
    Record a new Jenkins build execution result into the database.
    Called by Jenkinsfile pipeline stage 'Record to DevOps-AI DB' or by the deployment service.
    Protected: ADMIN or DEVOPS_ENGINEER only.
    """
    build = await repo.create(obj_in=payload)
    return GenericResponse(
        message=f"Jenkins build #{payload.build_number} for '{payload.job_name}' recorded successfully",
        data=JenkinsBuildRead.model_validate(build),
    )
