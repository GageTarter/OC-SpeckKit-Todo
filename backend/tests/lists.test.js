/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser, syncTestDatabase } from "./helpers.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("Feature 2 — Todo List Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .post("/todo/lists")
        .set(auth(user.body.token))
        .send({ name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.body.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .post("/todo/lists")
        .set(auth(user.body.token))
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name is required." });
      expect(await db.list.count()).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser(app);
      const name = "a".repeat(101);

      const res = await request(app)
        .post("/todo/lists")
        .set(auth(user.body.token))
        .send({ name });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const user = await registerUser(app);
      await db.list.create({ name: "Work", userId: user.body.userId });
      await db.list.create({ name: "Personal", userId: user.body.userId });

      const res = await request(app).get("/todo/lists").set(auth(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      await db.list.create({ name: "Mine", userId: userA.body.userId });
      await db.list.create({ name: "Secret Project", userId: userB.body.userId });

      const res = await request(app).get("/todo/lists").set(auth(userA.body.token));

      expect(res.body.map((list) => list.name)).toEqual(["Mine"]);
      expect(res.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });

      const res = await request(app)
        .put(`/todo/lists/${list.id}`)
        .set(auth(user.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: list.id,
        name: "Shopping",
        userId: user.body.userId,
      });
    });

    it("User deletes a list", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(auth(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.list.findByPk(list.id)).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret Project",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .put(`/todo/lists/${listB.id}`)
        .set(auth(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });
      await listB.reload();
      expect(listB.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret Project",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${listB.id}`)
        .set(auth(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });
      expect(await db.list.findByPk(listB.id)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });

      const res = await request(app)
        .post("/todo/lists")
        .set(auth(userA.body.token))
        .send({ name: "Groceries", userId: userB.body.userId });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);

      const stored = await db.list.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
