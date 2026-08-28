# Data Model Reference

**Status:** Feature 1 schema (users, sessions) plus `lists` for owner-scoped reads.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope |
| `role` | STRING(20) | Default `worker` |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared (`""`) on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from creation |
| `userId` | INTEGER FK | Required; references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `userId` | INTEGER FK | Required; references `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- `User` hasMany `Session` (`foreignKey: userId`)
- `Session` belongsTo `User`
- `User` hasMany `List` (`foreignKey: userId`)
- `List` belongsTo `User`

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` (table + read scope) | Feature 1 |
