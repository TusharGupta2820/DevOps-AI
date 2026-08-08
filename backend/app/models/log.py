from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import CheckConstraint, DateTime, Index, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel, utc_now

if TYPE_CHECKING:
    from app.models.server import Server
    from app.models.docker_container import DockerContainer


class Log(ProductionAuditModel):
    __tablename__ = "logs"
    __table_args__ = (
        CheckConstraint("level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')", name="ck_logs_level_valid"),
        Index("idx_logs_source_level_time", "source", "level", "timestamp"),
        Index("idx_logs_service_time", "service_name", "timestamp"),
    )

    source: Mapped[str] = mapped_column(String(100), index=True, nullable=False, default="app")
    level: Mapped[str] = mapped_column(String(20), index=True, nullable=False, default="INFO")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    service_name: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Foreign Keys
    server_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("servers.id", ondelete="SET NULL"), index=True, nullable=True)
    container_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("docker_containers.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationships
    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="logs")
    container: Mapped[Optional["DockerContainer"]] = relationship("DockerContainer", back_populates="logs")
