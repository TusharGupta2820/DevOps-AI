import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status

from app.auth.jwt import (
    create_access_token,
    create_purpose_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
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
from app.schemas.user import UserRead
from app.services.base import BaseService


class AuthService(BaseService):
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository,
        audit_repo: AuditLogRepository,
    ):
        super().__init__()
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.audit_repo = audit_repo

    async def login(
        self, payload: LoginRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> TokenResponse:
        user = await self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            await self.audit_repo.create_log(
                action="LOGIN_FAILED",
                resource=payload.email,
                details="Invalid credentials",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Contact platform administrator.",
            )

        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role,
        )

        refresh_token_jwt, family, expires_at = create_refresh_token(user_id=user.id)

        # Store Refresh Token in DB
        refresh_obj = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=refresh_token_jwt,
            token_family=family,
            is_revoked=False,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        await self.token_repo.create(refresh_obj)

        await self.audit_repo.create_log(
            action="LOGIN_SUCCESS",
            user_id=user.id,
            resource=f"user:{user.id}",
            details=f"User logged in with role {user.role}",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_jwt,
            expires_in=3600,
            user=UserRead.model_validate(user),
        )

    async def register(
        self, payload: RegisterRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> UserRead:
        existing = await self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account with this email already exists",
            )

        verification_token = str(uuid.uuid4())
        hashed_pwd = get_password_hash(payload.password)

        role = payload.role if payload.role in UserRole.ALL_ROLES else UserRole.VIEWER

        user_obj = User(
            id=str(uuid.uuid4()),
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hashed_pwd,
            role=role,
            is_active=True,
            is_verified=False,
            verification_token=verification_token,
        )

        created_user = await self.user_repo.create(user_obj)

        await self.audit_repo.create_log(
            action="USER_REGISTERED",
            user_id=created_user.id,
            resource=f"user:{created_user.id}",
            details=f"New user registered with role {role}",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return UserRead.model_validate(created_user)

    async def refresh_tokens(
        self, refresh_token_str: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token format",
            )

        token_obj = await self.token_repo.get_by_token(refresh_token_str)

        # Token Reuse / Theft Detection
        if not token_obj or token_obj.is_revoked:
            family = payload.get("family")
            if family:
                await self.token_repo.revoke_family(family)
            await self.audit_repo.create_log(
                action="SECURITY_REFRESH_TOKEN_REUSE",
                user_id=payload.get("sub"),
                details=f"Attempted reuse of revoked token family {family}",
                ip_address=ip_address,
                user_agent=user_agent,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token. All sessions revoked for security.",
            )

        # Check expiration
        if token_obj.expires_at < datetime.now(timezone.utc):
            await self.token_repo.revoke_by_token(refresh_token_str)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = await self.user_repo.get(token_obj.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or not found",
            )

        # Revoke current token (Refresh Token Rotation)
        await self.token_repo.revoke_by_token(refresh_token_str)

        # Issue new token pair with SAME family
        new_access_token = create_access_token(user_id=user.id, email=user.email, role=user.role)
        new_refresh_token, family, new_expires = create_refresh_token(
            user_id=user.id, token_family=token_obj.token_family
        )

        new_refresh_obj = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=new_refresh_token,
            token_family=family,
            is_revoked=False,
            expires_at=new_expires,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        await self.token_repo.create(new_refresh_obj)

        await self.audit_repo.create_log(
            action="TOKEN_ROTATED",
            user_id=user.id,
            details=f"Token rotated in family {family}",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=3600,
            user=UserRead.model_validate(user),
        )

    async def logout(
        self, refresh_token_str: Optional[str], user_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> None:
        if refresh_token_str:
            await self.token_repo.revoke_by_token(refresh_token_str)

        await self.audit_repo.create_log(
            action="LOGOUT",
            user_id=user_id,
            details="User logged out",
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def forgot_password(
        self, email: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Generic response to prevent user enumeration
            return {"message": "If an account with that email exists, a password reset link has been sent."}

        reset_token = str(uuid.uuid4())
        expires = datetime.now(timezone.utc) + timedelta(minutes=30)

        user.reset_password_token = reset_token
        user.reset_token_expires_at = expires
        await self.user_repo.update(user, obj_in={})

        await self.audit_repo.create_log(
            action="FORGOT_PASSWORD_REQUEST",
            user_id=user.id,
            resource=email,
            details="Reset password token generated",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return {
            "message": "Password reset token generated successfully",
            "reset_token": reset_token, # Returned for dev/testing environment workflow
        }

    async def reset_password(
        self, payload: ResetPasswordRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> None:
        user = await self.user_repo.get_by_reset_token(payload.token)
        if not user or not user.reset_token_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token",
            )

        if user.reset_token_expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token expired",
            )

        user.hashed_password = get_password_hash(payload.new_password)
        user.reset_password_token = None
        user.reset_token_expires_at = None
        await self.user_repo.update(user, obj_in={})

        # Revoke all existing sessions for security
        await self.token_repo.revoke_all_for_user(user.id)

        await self.audit_repo.create_log(
            action="PASSWORD_RESET_SUCCESS",
            user_id=user.id,
            details="Password successfully reset, sessions revoked",
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def verify_email(
        self, token: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> UserRead:
        user = await self.user_repo.get_by_verification_token(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email verification token",
            )

        user.is_verified = True
        user.verification_token = None
        updated_user = await self.user_repo.update(user, obj_in={})

        await self.audit_repo.create_log(
            action="EMAIL_VERIFIED",
            user_id=user.id,
            details="User email verified",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return UserRead.model_validate(updated_user)

    async def get_user_sessions(self, user_id: str) -> List[SessionRead]:
        sessions = await self.token_repo.get_user_sessions(user_id)
        return [SessionRead.model_validate(s) for s in sessions]

    async def revoke_session(
        self, session_id: str, user_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> bool:
        revoked = await self.token_repo.revoke_session_by_id(session_id, user_id)
        if revoked:
            await self.audit_repo.create_log(
                action="SESSION_REVOKED",
                user_id=user_id,
                details=f"Session {session_id} manually revoked",
                ip_address=ip_address,
                user_agent=user_agent,
            )
        return revoked
