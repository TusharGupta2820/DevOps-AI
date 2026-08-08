from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import CheckConstraint, Index, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.docker_container import DockerContainer
    from app.models.metric import Metric
    from app.models.log import Log
    from app.models.alert import Alert


class Server(ProductionAuditModel):
    __tablename__ = "servers"
    __table_args__ = (
        CheckConstraint("cpu_cores > 0", name="ck_servers_cpu_cores_positive"),
        CheckConstraint("ram_mb > 0", name="ck_servers_ram_mb_positive"),
        CheckConstraint("disk_gb > 0", name="ck_servers_disk_gb_positive"),
        CheckConstraint("status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEGRADED')", name="ck_servers_status_valid"),
        Index("idx_servers_env_status", "environment", "status"),
    )

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), index=True, nullable=False)
    environment: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="production")
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="ONLINE")
    os_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0 x86_64)")
    cpu_cores: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    ram_mb: Mapped[int] = mapped_column(Integer, nullable=False, default=32768)
    disk_gb: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    agent_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="v2.14.0")

    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys="[Server.created_by_id]", back_populates="servers")
    containers: Mapped[List["DockerContainer"]] = relationship("DockerContainer", back_populates="server", cascade="all, delete-orphan")
    metrics: Mapped[List["Metric"]] = relationship("Metric", back_populates="server", cascade="all, delete-orphan")
    logs: Mapped[List["Log"]] = relationship("Log", back_populates="server")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="server")
