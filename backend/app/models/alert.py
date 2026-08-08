from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.server import Server
    from app.models.user import User
    from app.models.notification import Notification


class Alert(ProductionAuditModel):
    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint("severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')", name="ck_alerts_severity_valid"),
        CheckConstraint("status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SILENCED')", name="ck_alerts_status_valid"),
        Index("idx_alerts_severity_status", "severity", "status"),
    )

    alert_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="HIGH")
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="ACTIVE")
    source: Mapped[str] = mapped_column(String(100), index=True, nullable=False, default="Prometheus Alertmanager")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Foreign Keys
    server_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("servers.id", ondelete="SET NULL"), index=True, nullable=True)
    assigned_to_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationships
    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="alerts")
    assigned_to_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_alerts")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="alert")
