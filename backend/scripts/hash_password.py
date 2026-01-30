#!/usr/bin/env python3
"""Generate a password hash."""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.security import hash_password

if __name__ == "__main__":
    password = "godzilla"
    hashed = hash_password(password)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
