# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign in with **username + password** (username `trim().toLowerCase()`) | `POST /todo/login` | Feature 1; ADR-0002 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hashes never returned | `User.create` + defaultScope | Feature 1 |
| Default role for new users is `worker` | Registration | Feature 1 |
| Session lifetime **24 hours**; reuse a non-expired session for the same user on login | Session row + JWT `expiresIn: 86400` | Feature 1 |
| Authenticated identity is `req.user.id` from a valid Session token | `authenticate` middleware | Feature 1; ADR-0002 |
| Client stores session under `localStorage` key `user`; axios sends `Authorization: Bearer <token>` | `Utils` + `services.js` | Feature 1 |
| On API `401` / unauthorized message, clear `user` and route to login | axios interceptor | Feature 1 |
| Unauthenticated visitors cannot stay on protected routes; signed-in users hitting login go home | `router.beforeEach` | Feature 1 |
| Registration email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."** | `emailRules` | Feature 1 |
| List queries and writes scoped with `userId: req.user.id`; create ignores body `userId` | `list.controller` + `getAccessibleListOrNull` | Feature 2; ADR-0002 |
| Cross-user list access → **`404`**, never `403` | `PUT`/`DELETE /todo/lists/:listId` | Feature 2; ADR-0002 |
| Lists returned **alphabetically by name** | `findAll` `order: name ASC` | Feature 2 |
| List names trimmed; empty rejected; max **100** characters | Controller + Dashboard form | Feature 2 |
| Dashboard empty state: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| `MenuBar` on signed-in routes; hidden on login/register | `App.vue` | Feature 2 |
| Todo queries/writes scoped by `userId`; parent list must be owned | `todo.controller` + `getAccessibleTodoOrNull` / `getAccessibleListOrNull` | Feature 3; ADR-0002 |
| Cross-user todo or parent list → **`404`**, never `403` | Todo API | Feature 3; ADR-0002 |
| Todos ordered **incomplete first**, then `createdAt` ascending | `findAllForList` | Feature 3 |
| New todos default `completed: false`; titles trimmed; max **255** | Create + Dashboard form | Feature 3 |
| Deleting a list **cascades** to its todos | `List hasMany Todo` `onDelete: CASCADE` | Feature 3 |
| List-items empty state: **"No todos in this list yet."** | `Dashboard.vue` items dialog | Feature 3 |
| `MenuBar` profile dropdown (name, username, email, **Edit Profile**, **Log out**); no standalone **Sign out** | `MenuBar.vue` | Feature 4 |
| Profile read/update only when `:id` equals `req.user.id`; else **404** | `getAccessibleUserOrNull` | Feature 4; ADR-0002 |
| After profile save, refresh `localStorage` `user` and dispatch `user-logged-in` | `MenuBar.vue` | Feature 4 |
| Optional todo `dueDate` (`YYYY-MM-DD` / `DATEONLY`); invalid → `400` | `todo.controller` | Feature 5 |
| `PUT` `dueDate: null` clears; omit `dueDate` leaves stored value | `todo.controller` | Feature 5 |
| Incomplete todos with `dueDate` before local today use overdue styling | `Dashboard.vue` + `isTodoOverdue` | Feature 5 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
