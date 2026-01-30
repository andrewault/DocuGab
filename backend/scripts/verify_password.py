#!/usr/bin/env python3
"""Test password verification."""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.security import verify_password

if __name__ == "__main__":
    password = "godzilla"
    stored_hash = "$2b$12$a3ej29uRxTrM/YJF32fLt.XGnx4F9cJ3HHYVnxeOg88a5UjdinGmS"
    
    result = verify_password(password, stored_hash)
    print(f"Password: {password}")
    print(f"Hash: {stored_hash}")
    print(f"Verification result: {result}")
