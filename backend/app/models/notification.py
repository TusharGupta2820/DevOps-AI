from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, CheckConstraint, DateTime, Index, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.alert import Alert


class Notification(ProductionAuditModel):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint("type IN ('INFO', 'ALERT', 'DEPLOYMENT', 'SECURITY')", name="ck_notifications_type_valid"),
        CheckConstraint("channel IN ('IN_APP', 'EMAIL', 'SLACK', 'WEBHOOK')", name="ck_notifications_channel_valid"),
        Index("idx_notifications_user_read", "user_id", "is_read"),
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default="IN_APP", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Foreign Keys
    alert_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("alerts.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    alert: Mapped[Optional["Alert"]] = relationship("Alert", back_populates="notifications")
