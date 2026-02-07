import asyncio
from sqlalchemy import select
from app.db.base import AsyncSessionLocal
from app.models.user import User

async def check_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.is_admin == True))
        admins = result.scalars().all()
        
        if not admins:
            all_users = await db.execute(select(User))
            for user in all_users.scalars().all():
        else:
            for admin in admins:

asyncio.run(check_admin())
