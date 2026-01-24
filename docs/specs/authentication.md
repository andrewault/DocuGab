# Authentication Specification

## Overview

JWT-based authentication with refresh token rotation for secure session management.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate and get tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new tokens |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Get current user profile |

## Token Configuration

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Access token expiry | 15 minutes | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Refresh token expiry | 7 days | `REFRESH_TOKEN_EXPIRE_DAYS` |
| Secret key | - | `SECRET_KEY` (min 32 chars) |

## User Model

```python
class User:
    id: int                  # Primary key
    email: str               # Unique, lowercase
    password_hash: str       # bcrypt hashed
    full_name: str | None    # Display name
    role: str                # user | admin | superadmin
    is_active: bool          # Account enabled
    is_verified: bool        # Email verified
    created_at: datetime
    updated_at: datetime
```

## Roles & Permissions

| Role | Can access app | Can manage users | Can delete any user |
|------|---------------|------------------|---------------------|
| user | ✅ | ❌ | ❌ |
| admin | ✅ | ✅ | ❌ |
| superadmin | ✅ | ✅ | ✅ |

## Token Flow

1. **Login**: User submits email/password → receives access + refresh tokens
2. **API calls**: Include `Authorization: Bearer {access_token}` header
3. **Token refresh**: When access token expires, POST refresh token to get new pair
4. **Logout**: Revokes refresh token server-side

## Password Requirements

- Minimum 8 characters (enforced by frontend)
- Hashed with bcrypt (cost factor 12)
- Maximum 72 bytes (bcrypt limitation)

## Security Features

- Refresh token rotation (old token invalidated on refresh)
- Session stored in database for revocation
- Tokens include `iat` and `exp` claims
- CORS restricted to configured origins
