from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_user, get_current_user_optional
from app.database.session import get_db
from app.repositories.audit_log import AuditLogRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SessionRead,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import GenericResponse
from app.schemas.user import UserRead
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Enterprise Authentication"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    user_repo = UserRepository(db)
    token_repo = RefreshTokenRepository(db)
    audit_repo = AuditLogRepository(db)
    return AuthService(user_repo, token_repo, audit_repo)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    return await service.login(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/register", response_model=GenericResponse[UserRead], status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    user = await service.register(payload, ip_address=ip_address, user_agent=user_agent)
    return GenericResponse(message="Registration successful. Please verify your email.", data=user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    return await service.refresh_tokens(payload.refresh_token, ip_address=ip_address, user_agent=user_agent)


@router.post("/logout", response_model=GenericResponse[None])
async def logout(
    request: Request,
    payload: Optional[RefreshTokenRequest] = None,
    current_user: dict = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    refresh_token_str = payload.refresh_token if payload else None
    await service.logout(refresh_token_str, user_id=current_user["sub"], ip_address=ip_address, user_agent=user_agent)
    return GenericResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=GenericResponse[dict])
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    res = await service.forgot_password(payload.email, ip_address=ip_address, user_agent=user_agent)
    return GenericResponse(message="Password reset request processed", data=res)


@router.post("/reset-password", response_model=GenericResponse[None])
async def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    await service.reset_password(payload, ip_address=ip_address, user_agent=user_agent)
    return GenericResponse(message="Password successfully reset. You can now log in.")


@router.post("/verify-email", response_model=GenericResponse[UserRead])
async def verify_email(
    request: Request,
    payload: VerifyEmailRequest,
    service: AuthService = Depends(get_auth_service),
    user_agent: Optional[str] = Header(None),
):
    ip_address = request.client.host if request.client else None
    user = await service.verify_email(payload.token, ip_address=ip_address, user_agent=user_agent)
    return GenericResponse(message="Email verified successfully", data=user)


@router.get("/me", response_model=GenericResponse[UserRead])
async def get_current_user_profile(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    user = await user_repo.get(current_user["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return GenericResponse(data=UserRead.model_validate(user))


@router.get("/sessions", response_model=GenericResponse[List[SessionRead]])
async def list_active_sessions(
    current_user: dict = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    sessions = await service.get_user_sessions(current_user["sub"])
    return GenericResponse(data=sessions)


@router.delete("/sessions/{session_id}", response_model=GenericResponse[None])
async def revoke_session(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    ip_address = request.client.host if request.client else None
    revoked = await service.revoke_session(session_id, current_user["sub"], ip_address=ip_address)
    if not revoked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or already revoked")
    return GenericResponse(message="Session revoked successfully")
