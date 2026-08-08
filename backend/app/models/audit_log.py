from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, Index, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel, utc_now

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(ProductionAuditModel):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_action_time", "action", "created_at"),
        Index("idx_audit_logs_user_action", "user_id", "action"),
    )

    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    actor: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    target_resource: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), index=True, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    extra_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    # Foreign Keys
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationship
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")
