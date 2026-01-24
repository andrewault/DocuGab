# Admin Specification

## Overview

Administrative dashboard for user management and system statistics.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users (paginated) |
| GET | `/api/admin/users/{id}` | Get user details |
| PATCH | `/api/admin/users/{id}` | Update user |
| DELETE | `/api/admin/users/{id}` | Delete user |

## Access Control

- All admin endpoints require `admin` or `superadmin` role
- Only `superadmin` can delete other admin users
- Users cannot delete themselves

## Stats Response

```json
{
  "total_users": 42,
  "new_users_today": 3,
  "active_sessions": 15,
  "total_documents": 128
}
```

## User List Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | int | 0 | Pagination offset |
| limit | int | 50 | Page size (max 100) |
| search | string | - | Filter by email/name |
| role | string | - | Filter by role |

## User Update Request

```json
{
  "full_name": "John Doe",
  "role": "admin",
  "is_active": true,
  "is_verified": true
}
```

All fields are optional; only provided fields are updated.

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | Dashboard | Stats cards + user table |
| `/admin/users/:id` | UserDetail | Edit user form |

## Dashboard Features

- **Stats cards**: Total users, new today, active sessions, documents
- **User table**: Sortable, searchable, clickable rows
- **Quick actions**: Edit, delete from table row
- **Escape key**: Returns to dashboard from user detail

## Initial Admin User

Set in `.env` to auto-create on startup:

```env
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=securepassword
```

Created with `superadmin` role if not exists.
