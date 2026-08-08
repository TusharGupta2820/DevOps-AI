from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, obj_in: RefreshToken) -> RefreshToken:
        self.session.add(obj_in)
        await self.session.commit()
        await self.session.refresh(obj_in)
        return obj_in

    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        query = select(RefreshToken).where(RefreshToken.token == token)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def revoke_by_token(self, token: str) -> None:
        stmt = update(RefreshToken).where(RefreshToken.token == token).values(is_revoked=True)
        await self.session.execute(stmt)
        await self.session.commit()

    async def revoke_family(self, token_family: str) -> None:
        """Revoke all tokens in a family (e.g. if a stolen token was reused)."""
        stmt = update(RefreshToken).where(RefreshToken.token_family == token_family).values(is_revoked=True)
        await self.session.execute(stmt)
        await self.session.commit()

    async def revoke_all_for_user(self, user_id: str) -> None:
        stmt = update(RefreshToken).where(RefreshToken.user_id == user_id).values(is_revoked=True)
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_user_sessions(self, user_id: str) -> List[RefreshToken]:
        query = (
            select(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
            .order_by(RefreshToken.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def revoke_session_by_id(self, session_id: str, user_id: str) -> bool:
        query = select(RefreshToken).where(RefreshToken.id == session_id, RefreshToken.user_id == user_id)
        result = await self.session.execute(query)
        session_obj = result.scalars().first()
        if session_obj:
            session_obj.is_revoked = True
            await self.session.commit()
            return True
        return False
