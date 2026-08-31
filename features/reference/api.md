# API Reference

**Status:** Features 1–5 (auth, lists, todos, profile, due dates).

API mount path: `/todo` (`backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create account and return session payload |
| `POST` | `/todo/login` | No | Authenticate with username + password |
| `POST` | `/todo/logout` | Yes | Revoke the current session token |
| `GET` | `/todo/lists` | Yes | Lists owned by `req.user.id`, name A–Z |
| `POST` | `/todo/lists` | Yes | Create a list owned by `req.user.id` |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |
| `GET` | `/todo/lists/:listId/todos` | Yes | Todos in an owned list (incomplete first, then `createdAt`) |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update title, `completed`, and/or `dueDate` |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Own profile only |
| `PUT` | `/todo/users/:id` | Yes | Update own profile; password optional |

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

## List create body

```json
{ "name": "Groceries" }
```

`userId` in the body is ignored. Ownership is always `req.user.id`.

## List success (`200` / `201`)

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

Delete returns `200` with `{ "message": "List deleted." }`.

## Todo create body

```json
{ "title": "Buy milk", "dueDate": "2026-07-15" }
```

`dueDate` is optional (`YYYY-MM-DD`). Omit it or send `null` for no due date. `userId` and `listId` in the body are ignored.

## Todo success (`200` / `201`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`dueDate` is `null` when not set. `PUT` with `{ "dueDate": null }` clears it; omitting `dueDate` leaves the stored value unchanged.

Delete todo returns `200` with `{ "message": "Todo deleted." }`.

## Profile update body

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Role is not editable.

## Profile success (`200`)

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
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
| Empty list name | `400` | `List name is required.` |
| List name longer than 100 characters | `400` | `List name must be 100 characters or fewer.` |
| List not found or not owned | `404` | `List with id=<id> not found.` |
| Empty todo title | `400` | `Todo title is required.` |
| Todo title longer than 255 characters | `400` | `Todo title must be 255 characters or fewer.` |
| Todo not found or not owned | `404` | `Todo with id=<id> not found.` |
| Invalid todo due date | `400` | `Due date must be a valid date in YYYY-MM-DD format.` |
| User not found or not self | `404` | `User with id=<id> not found.` |
| Profile password too short | `400` | `Password must be at least 8 characters.` |
| Profile missing first name | `400` | `First name is required.` |

## Feature provenance

| Area | Introduced |
|------|------------|
| Auth register / login / logout | Feature 1 |
| List CRUD (`GET/POST/PUT/DELETE /todo/lists`) | Feature 2 |
| Todo items (`/todo/lists/:listId/todos`, `/todo/todos/:id`) | Feature 3 |
| Profile `GET/PUT /todo/users/:id` | Feature 4 |
| Optional todo `dueDate` | Feature 5 |
