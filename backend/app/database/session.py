from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config.settings import settings

import socket

# Check if port is open to determine if PostgreSQL daemon is running
def is_port_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except OSError:
        return False

db_url = str(settings.DATABASE_URL)
if "postgresql" in db_url:
    try:
        # e.g., postgresql+asyncpg://postgres:password@localhost:5432/devops_copilot
        host_port = db_url.split("@")[1].split("/")[0]
        if ":" in host_port:
            host, port_str = host_port.split(":")
            port = int(port_str)
        else:
            host = host_port
            port = 5432
        
        if not is_port_open(host, port):
            print(f"⚠️ PostgreSQL not reachable at {host}:{port}. Falling back to local SQLite database.")
            db_url = "sqlite+aiosqlite:///./devops_copilot.db"
    except Exception:
        db_url = "sqlite+aiosqlite:///./devops_copilot.db"

# SQLite does not support pool_size and max_overflow arguments in create_async_engine
engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}
if "sqlite" not in db_url:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing asynchronous database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
