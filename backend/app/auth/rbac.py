from typing import List, Callable
from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_active_user
from app.models.user import UserRole


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_active_user)) -> dict:
        user_role = current_user.get("role", UserRole.VIEWER)
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in: {self.allowed_roles}, but current role is '{user_role}'",
            )
        return current_user


def require_roles(allowed_roles: List[str]) -> Callable:
    return RoleChecker(allowed_roles)


require_admin = RoleChecker([UserRole.ADMIN])
require_devops_or_admin = RoleChecker([UserRole.ADMIN, UserRole.DEVOPS_ENGINEER])
require_any_authenticated = RoleChecker([UserRole.ADMIN, UserRole.DEVOPS_ENGINEER, UserRole.VIEWER])
