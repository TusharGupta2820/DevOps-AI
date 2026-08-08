from typing import Optional, TYPE_CHECKING
from sqlalchemy import CheckConstraint, Integer, String, Text, UniqueConstraint, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.repository import Repository
    from app.models.deployment import Deployment
    from app.models.user import User


class JenkinsBuild(ProductionAuditModel):
    __tablename__ = "jenkins_builds"
    __table_args__ = (
        UniqueConstraint("job_name", "build_number", name="uq_jenkins_job_build_number"),
        CheckConstraint("status IN ('SUCCESS', 'BUILDING', 'FAILURE', 'ABORTED', 'UNSTABLE')", name="ck_jenkins_status_valid"),
        Index("idx_jenkins_job_status", "job_name", "status"),
    )

    job_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    build_number: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    commit_sha: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    status: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="SUCCESS")
    trigger_cause: Mapped[str] = mapped_column(String(255), default="Webhook / SCM Trigger", nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=124000, nullable=False)
    build_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    artifact_paths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Foreign Keys
    repository_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("repositories.id", ondelete="SET NULL"), index=True, nullable=True)
    deployment_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deployments.id", ondelete="SET NULL"), index=True, nullable=True)
    triggered_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    # Relationships
    repository: Mapped[Optional["Repository"]] = relationship("Repository", back_populates="jenkins_builds")
    deployment: Mapped[Optional["Deployment"]] = relationship("Deployment", back_populates="jenkins_builds")
    triggered_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[triggered_by_id], back_populates="jenkins_builds")
