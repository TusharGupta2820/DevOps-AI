from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_admin, require_devops_or_admin
from app.database.session import get_db
from app.repositories.audit_log import AuditLogRepository
from app.repositories.user import UserRepository
from app.schemas.common import GenericResponse
from app.schemas.user import UserRead, UserRoleUpdate
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["User Management & RBAC"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    user_repo = UserRepository(db)
    audit_repo = AuditLogRepository(db)
    return UserService(user_repo, audit_repo)


@router.get("", response_model=GenericResponse[List[UserRead]])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_devops_or_admin),
    service: UserService = Depends(get_user_service),
):
    users = await service.list_users(skip=skip, limit=limit)
    return GenericResponse(data=users)


@router.patch("/{user_id}/role", response_model=GenericResponse[UserRead])
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    request: Request,
    current_user: dict = Depends(require_admin),
    service: UserService = Depends(get_user_service),
):
    ip_address = request.client.host if request.client else None
    user = await service.update_user_role(
        user_id=user_id,
        payload=payload,
        admin_id=current_user["sub"],
        ip_address=ip_address,
    )
    return GenericResponse(message=f"User role updated to {payload.role}", data=user)
