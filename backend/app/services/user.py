from typing import List, Optional
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.repositories.audit_log import AuditLogRepository
from app.repositories.user import UserRepository
from app.schemas.user import UserRead, UserRoleUpdate, UserUpdate
from app.services.base import BaseService


class UserService(BaseService):
    def __init__(self, user_repo: UserRepository, audit_repo: AuditLogRepository):
        super().__init__()
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def list_users(self, skip: int = 0, limit: int = 50) -> List[UserRead]:
        users = await self.user_repo.get_multi(skip=skip, limit=limit)
        return [UserRead.model_validate(u) for u in users]

    async def get_user_by_id(self, user_id: str) -> UserRead:
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )
        return UserRead.model_validate(user)

    async def update_user_role(
        self, user_id: str, payload: UserRoleUpdate, admin_id: str, ip_address: Optional[str] = None
    ) -> UserRead:
        if payload.role not in UserRole.ALL_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{payload.role}'. Must be one of {UserRole.ALL_ROLES}",
            )

        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

        old_role = user.role
        user.role = payload.role
        updated_user = await self.user_repo.update(user, obj_in={})

        await self.audit_repo.create_log(
            action="ROLE_UPDATED",
            user_id=admin_id,
            resource=f"user:{user_id}",
            details=f"Updated role of {user.email} from {old_role} to {payload.role}",
            ip_address=ip_address,
        )

        return UserRead.model_validate(updated_user)
