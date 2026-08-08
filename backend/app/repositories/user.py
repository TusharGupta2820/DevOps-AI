from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_verification_token(self, token: str) -> Optional[User]:
        query = select(User).where(User.verification_token == token)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_reset_token(self, token: str) -> Optional[User]:
        query = select(User).where(User.reset_password_token == token)
        result = await self.session.execute(query)
        return result.scalars().first()
