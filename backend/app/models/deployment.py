from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import CheckConstraint, Index, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.repository import Repository
    from app.models.user import User
    from app.models.jenkins_build import JenkinsBuild


class Deployment(ProductionAuditModel):
    __tablename__ = "deployments"
    __table_args__ = (
        CheckConstraint("status IN ('SUCCESS', 'DEPLOYING', 'FAILED', 'ROLLBACK', 'PENDING')", name="ck_deployments_status_valid"),
        Index("idx_deployments_env_status", "environment", "status"),
    )

    deployment_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    service_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    environment: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="production")
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False, default="SUCCESS")
    cluster: Mapped[str] = mapped_column(String(100), nullable=False, default="us-east-cluster-01")
    commit_hash: Mapped[str] = mapped_column(String(40), nullable=False)
    author: Mapped[str] = mapped_column(String(100), nullable=False)
    logs_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=45, nullable=False)
    rollback_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Foreign Keys
    repository_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("repositories.id", ondelete="SET NULL"), index=True, nullable=True)
    deployed_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationships
    repository: Mapped[Optional["Repository"]] = relationship("Repository", back_populates="deployments")
    deployed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[deployed_by_id], back_populates="deployments")
    jenkins_builds: Mapped[List["JenkinsBuild"]] = relationship("JenkinsBuild", back_populates="deployment")
