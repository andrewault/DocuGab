import asyncio
import sys
import os

# Add backend directory to python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import async_session_maker
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy import select


async def reset_password(email, new_password):
    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"User {email} not found")
            return

        user.password_hash = hash_password(new_password)
        await session.commit()
        print(f"Password for {email} reset successfully")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <email> <new_password>")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    asyncio.run(reset_password(email, password))
