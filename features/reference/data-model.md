# Data Model Reference

**Status:** Features 1–4 (users/sessions, lists, todos; profile uses `users`).

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `lName` | STRING | Required; editable via `PUT /todo/users/:id` |
| `email` | STRING | Required, unique; editable via `PUT /todo/users/:id` |
| `username` | STRING(100) | Required, unique; stored lowercase; editable via `PUT /todo/users/:id` |
| `password` | STRING(255) | Required; bcrypt hash only; excluded from default scope; optional on profile update |
| `role` | STRING(20) | Default `worker`; read-only in profile API |

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

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; trimmed; max 255 chars |
| `completed` | BOOLEAN | Default `false` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- `User` hasMany `Session` (`foreignKey: userId`)
- `Session` belongsTo `User`
- `User` hasMany `List` (`foreignKey: userId`)
- `List` belongsTo `User`
- `User` hasMany `Todo`
- `Todo` belongsTo `User`
- `List` hasMany `Todo` (`onDelete: CASCADE`)
- `Todo` belongsTo `List`

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` | Feature 1 |
| `lists` CRUD | Feature 2 |
| `todos` | Feature 3 |
| Profile updates on `users` (no new table) | Feature 4 |
