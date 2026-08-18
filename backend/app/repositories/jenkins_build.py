from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.jenkins_build import JenkinsBuild
from app.repositories.base import BaseRepository
from app.schemas.jenkins_build import JenkinsBuildCreate


class JenkinsBuildRepository(BaseRepository[JenkinsBuild, JenkinsBuildCreate, JenkinsBuildCreate]):
    def __init__(self, session: AsyncSession):
        super().__init__(JenkinsBuild, session)

    async def get_by_job_name(self, job_name: str, limit: int = 20) -> List[JenkinsBuild]:
        """Fetch build history filtered by a specific Jenkins job name."""
        query = (
            select(JenkinsBuild)
            .where(JenkinsBuild.job_name == job_name)
            .order_by(JenkinsBuild.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_status(self, status: str, limit: int = 20) -> List[JenkinsBuild]:
        """Fetch builds filtered by execution status (SUCCESS, FAILURE, ABORTED, etc.)."""
        query = (
            select(JenkinsBuild)
            .where(JenkinsBuild.status == status)
            .order_by(JenkinsBuild.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_recent_builds(self, limit: int = 50) -> List[JenkinsBuild]:
        """Fetch the most recent Jenkins build executions across all jobs."""
        query = select(JenkinsBuild).order_by(JenkinsBuild.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())
