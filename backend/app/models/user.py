from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.server import Server
    from app.models.deployment import Deployment
    from app.models.jenkins_build import JenkinsBuild
    from app.models.alert import Alert
    from app.models.notification import Notification
    from app.models.ai_conversation import AIConversation
    from app.models.audit_log import AuditLog


class UserRole:
    ADMIN = "ADMIN"
    DEVOPS_ENGINEER = "DEVOPS_ENGINEER"
    VIEWER = "VIEWER"

    ALL_ROLES = [ADMIN, DEVOPS_ENGINEER, VIEWER]


class User(ProductionAuditModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default=UserRole.VIEWER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_password_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    servers: Mapped[List["Server"]] = relationship("Server", foreign_keys="Server.created_by_id", back_populates="creator")
    deployments: Mapped[List["Deployment"]] = relationship("Deployment", foreign_keys="Deployment.deployed_by_id", back_populates="deployed_by_user")
    jenkins_builds: Mapped[List["JenkinsBuild"]] = relationship("JenkinsBuild", foreign_keys="JenkinsBuild.triggered_by_id", back_populates="triggered_by_user")
    assigned_alerts: Mapped[List["Alert"]] = relationship("Alert", foreign_keys="Alert.assigned_to_id", back_populates="assigned_to_user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")
    ai_conversations: Mapped[List["AIConversation"]] = relationship("AIConversation", foreign_keys="AIConversation.user_id", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", foreign_keys="AuditLog.user_id", back_populates="user")
