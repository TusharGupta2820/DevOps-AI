from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.deployment import Deployment
from app.repositories.base import BaseRepository
from app.schemas.deployment import DeploymentCreate, DeploymentUpdate


class DeploymentRepository(BaseRepository[Deployment, DeploymentCreate, DeploymentUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(Deployment, session)

    async def get_by_service_and_env(
        self, service_name: str, environment: str, limit: int = 10
    ) -> List[Deployment]:
        query = (
            select(Deployment)
            .where(
                Deployment.service_name == service_name,
                Deployment.environment == environment,
            )
            .order_by(Deployment.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_recent_deployments(self, limit: int = 10) -> List[Deployment]:
        query = select(Deployment).order_by(Deployment.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
