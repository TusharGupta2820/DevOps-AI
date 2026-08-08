from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Boolean, CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import ProductionAuditModel

if TYPE_CHECKING:
    from app.models.deployment import Deployment
    from app.models.jenkins_build import JenkinsBuild


class Repository(ProductionAuditModel):
    __tablename__ = "repositories"
    __table_args__ = (
        CheckConstraint("provider IN ('GITHUB', 'GITLAB', 'BITBUCKET')", name="ck_repositories_provider_valid"),
    )

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    git_url: Mapped[str] = mapped_column(String(512), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="GITHUB", index=True, nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    language: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="TypeScript")

    # Relationships
    deployments: Mapped[List["Deployment"]] = relationship("Deployment", back_populates="repository")
    jenkins_builds: Mapped[List["JenkinsBuild"]] = relationship("JenkinsBuild", back_populates="repository")
