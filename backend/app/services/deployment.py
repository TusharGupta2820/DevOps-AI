from typing import List, Optional
from fastapi import HTTPException, status
from app.repositories.deployment import DeploymentRepository
from app.schemas.deployment import DeploymentCreate, DeploymentRead, DeploymentUpdate
from app.services.base import BaseService
from app.integrations.jenkins import JenkinsClient


class DeploymentService(BaseService):
    def __init__(self, repository: DeploymentRepository):
        super().__init__()
        self.repository = repository

    async def list_deployments(self, page: int = 1, size: int = 20) -> List[DeploymentRead]:
        skip = (page - 1) * size
        self.logger.info("listing_deployments", page=page, size=size)
        deployments = await self.repository.get_multi(skip=skip, limit=size)
        return [DeploymentRead.model_validate(d) for d in deployments]

    async def get_deployment_by_id(self, deployment_id: str) -> DeploymentRead:
        deployment = await self.repository.get(deployment_id)
        if not deployment:
            self.logger.warning("deployment_not_found", deployment_id=deployment_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deployment with ID {deployment_id} not found",
            )
        return DeploymentRead.model_validate(deployment)

    async def create_deployment(self, payload: DeploymentCreate) -> DeploymentRead:
        self.logger.info(
            "triggering_deployment",
            service=payload.service_name,
            env=payload.environment,
            version=payload.version,
        )
        
        # Instantiate Jenkins client and trigger the build
        jenkins = JenkinsClient()
        try:
            job_name = f"deploy-{payload.service_name.lower().replace(' ', '-')}"
            build_info = await jenkins.trigger_job(
                job_name=job_name,
                parameters={
                    "VERSION": payload.version,
                    "ENVIRONMENT": payload.environment,
                    "COMMIT_HASH": payload.commit_hash,
                    "AUTHOR": payload.author,
                }
            )
            # Append Jenkins URL or Location to logs_url for tracking
            if build_info.get("url"):
                payload.logs_url = build_info["url"]
            elif build_info.get("location"):
                payload.logs_url = build_info["location"]
        except Exception as e:
            self.logger.error("jenkins_trigger_failed_during_create", error=str(e))

        deployment = await self.repository.create(obj_in=payload)
        return DeploymentRead.model_validate(deployment)

    async def update_deployment_status(
        self, deployment_id: str, payload: DeploymentUpdate
    ) -> DeploymentRead:
        deployment = await self.repository.get(deployment_id)
        if not deployment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deployment with ID {deployment_id} not found",
            )
        updated = await self.repository.update(db_obj=deployment, obj_in=payload)
        self.logger.info("deployment_status_updated", deployment_id=deployment_id, new_status=payload.status)
        return DeploymentRead.model_validate(updated)

    async def get_total_count(self) -> int:
        return await self.repository.count()
