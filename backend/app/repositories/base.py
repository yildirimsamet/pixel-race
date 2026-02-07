
from typing import Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger

logger = get_logger(__name__)

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):


    def __init__(self, model: Type[ModelType], db: AsyncSession):

        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:

        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, limit: Optional[int] = None) -> List[ModelType]:

        query = select(self.model)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> ModelType:

        entity = self.model(**kwargs)
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        logger.debug(f"Created {self.model.__name__} with id={entity.id}")
        return entity

    async def update(self, entity: ModelType) -> ModelType:

        await self.db.flush()
        await self.db.refresh(entity)
        logger.debug(f"Updated {self.model.__name__} with id={entity.id}")
        return entity

    async def delete(self, entity: ModelType) -> None:

        await self.db.delete(entity)
        await self.db.flush()
        logger.debug(f"Deleted {self.model.__name__}")

    async def count(self) -> int:

        result = await self.db.execute(select(func.count()).select_from(self.model))
        return result.scalar_one()