# API Reference

**Status:** Feature 1 auth + session-scoped list read.

API mount path: `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create account and return session payload |
| `POST` | `/todo/login` | No | Authenticate with username + password |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Return lists owned by `req.user.id` (empty until Feature 2 writes lists) |

## Auth success payload (`201` register / `200` login)

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never included.

## Errors

`{ "message": "Human-readable explanation." }`

| Situation | Status | Message |
|-----------|--------|---------|
| Duplicate username | `400` | `Username is already taken.` |
| Duplicate email | `400` | `Email is already registered.` |
| Invalid credentials | `401` | `Invalid username or password.` |
| Missing/invalid/expired token | `401` | Message includes `Unauthorized` |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth register / login / logout | Feature 1 |
| `GET /todo/lists` (read, owner-scoped) | Feature 1 |
