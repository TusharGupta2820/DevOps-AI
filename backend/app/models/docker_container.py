from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import CheckConstraint, DateTime, Float, Index, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.server import Server
    from app.models.log import Log


class DockerContainer(ProductionAuditModel):
    __tablename__ = "docker_containers"
    __table_args__ = (
        CheckConstraint("status IN ('RUNNING', 'STOPPED', 'PAUSED', 'EXITED', 'RESTARTING')", name="ck_docker_containers_status_valid"),
        Index("idx_docker_containers_server_status", "server_id", "status"),
    )

    container_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    image: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    server_id: Mapped[str] = mapped_column(String(36), ForeignKey("servers.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="RUNNING")
    ports_mapping: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    cpu_usage_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    memory_usage_mb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    server: Mapped["Server"] = relationship("Server", back_populates="containers")
    logs: Mapped[List["Log"]] = relationship("Log", back_populates="container")
