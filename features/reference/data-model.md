# Data Model Reference

**Status:** Feature 1 users/sessions + Feature 2 lists.

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
| `name` | STRING(100) | Required; trimmed; max 100 chars |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create; never changes |
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
| `lists` CRUD | Feature 2 |
