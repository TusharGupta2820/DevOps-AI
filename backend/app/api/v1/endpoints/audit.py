from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_devops_or_admin
from app.database.session import get_db
from app.repositories.audit_log import AuditLogRepository
from app.schemas.auth import AuditLogRead
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logging"])


@router.get("", response_model=PaginatedResponse[AuditLogRead])
async def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_devops_or_admin),
    db: AsyncSession = Depends(get_db),
):
    audit_repo = AuditLogRepository(db)
    skip = (page - 1) * size
    logs = await audit_repo.list_logs(limit=size, skip=skip)
    total = await audit_repo.count_logs()
    pages = (total + size - 1) // size if total > 0 else 1

    return PaginatedResponse(
        items=[AuditLogRead.model_validate(l) for l in logs],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
