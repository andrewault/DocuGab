#!/usr/bin/env python3
"""Create a superadmin user directly in the database."""

import asyncio
import os
import sys
from pathlib import Path

# Set database URL to connect to Docker database on port 5433
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://docutok:docutok_secret@localhost:5433/docutok'

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password


async def create_superadmin():
    """Create a superadmin user."""
    email = "andrewault@gmail.com"
    password = "godzilla"
    full_name = "Andrew Ault"
    
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"User {email} already exists with role: {existing_user.role}")
            if existing_user.role != "superadmin":
                existing_user.role = "superadmin"
                existing_user.is_active = True
                existing_user.is_verified = True
                await session.commit()
                print(f"Updated {email} to superadmin")
            return
        
        # Create new superadmin user
        hashed_password = hash_password(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role="superadmin",
            is_active=True,
            is_verified=True,
        )
        
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        print(f"✅ Superadmin user created successfully!")
        print(f"   Email: {email}")
        print(f"   UUID: {user.uuid}")
        print(f"   Role: {user.role}")


if __name__ == "__main__":
    asyncio.run(create_superadmin())
