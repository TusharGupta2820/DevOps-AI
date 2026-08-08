from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, Float, Index, String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel, utc_now

if TYPE_CHECKING:
    from app.models.server import Server


class Metric(ProductionAuditModel):
    __tablename__ = "metrics"
    __table_args__ = (
        Index("idx_metrics_name_timestamp", "metric_name", "timestamp"),
        Index("idx_metrics_server_name_time", "server_id", "metric_name", "timestamp"),
    )

    metric_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="%")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Foreign Keys
    server_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("servers.id", ondelete="CASCADE"), index=True, nullable=True)

    # Relationships
    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="metrics")
