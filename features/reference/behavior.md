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
| `GET /todo/lists` returns only rows with `userId = req.user.id` | `list.controller` findAll | Feature 1 |
| Auth screens and Feature 1 home use full-screen layout (**no MenuBar**); home shows welcome + **Sign out** | `App.vue`, `Home.vue` | Feature 1 |
| Registration email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."** | `emailRules` | Feature 1 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.
