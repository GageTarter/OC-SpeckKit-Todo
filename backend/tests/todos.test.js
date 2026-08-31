/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser, syncTestDatabase } from "./helpers.js";

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(auth(user.body.token))
        .send({ title: "Buy milk" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "Buy milk",
        completed: false,
        userId: user.body.userId,
        listId: list.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(auth(user.body.token))
        .send({ title: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Todo title is required." });
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listA = await db.list.create({ name: "Work", userId: userA.body.userId });
      const listB = await db.list.create({ name: "Work", userId: userB.body.userId });
      await db.todo.create({
        title: "My task",
        listId: listA.id,
        userId: userA.body.userId,
      });
      await db.todo.create({
        title: "Their task",
        listId: listB.id,
        userId: userB.body.userId,
      });

      const res = await request(app)
        .get(`/todo/lists/${listA.id}/todos`)
        .set(auth(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });
      const todo = await db.todo.create({
        title: "Buy milk",
        completed: false,
        listId: list.id,
        userId: user.body.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(auth(user.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });
      const todo = await db.todo.create({
        title: "Buy milk",
        completed: true,
        listId: list.id,
        userId: user.body.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(auth(user.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.body.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(auth(user.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/todos/${todo.id}`)
        .set(auth(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.findByPk(todo.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret",
        userId: userB.body.userId,
      });
      await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.body.userId,
      });

      const res = await request(app)
        .get(`/todo/lists/${listB.id}/todos`)
        .set(auth(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });
      expect(JSON.stringify(res.body)).not.toMatch(/Hidden task/);
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret",
        userId: userB.body.userId,
      });

      const res = await request(app)
        .post(`/todo/lists/${listB.id}/todos`)
        .set(auth(userA.body.token))
        .send({ title: "Intruder task" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.id} not found.`,
      });
      expect(await db.todo.count({ where: { listId: listB.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret",
        userId: userB.body.userId,
      });
      const todoB = await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.body.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todoB.id}`)
        .set(auth(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.id} not found.`,
      });
      await todoB.reload();
      expect(todoB.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const listB = await db.list.create({
        name: "Secret",
        userId: userB.body.userId,
      });
      const todoB = await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/todos/${todoB.id}`)
        .set(auth(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.id} not found.`,
      });
      expect(await db.todo.findByPk(todoB.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        email: "b@example.com",
        username: "userb",
      });
      const list = await db.list.create({
        name: "Groceries",
        userId: userA.body.userId,
      });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(auth(userA.body.token))
        .send({ title: "Buy milk", userId: userB.body.userId });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      const stored = await db.todo.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser(app);
      const list = await db.list.create({
        name: "Groceries",
        userId: user.body.userId,
      });
      await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.body.userId,
      });
      await db.todo.create({
        title: "Buy eggs",
        listId: list.id,
        userId: user.body.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(auth(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.count({ where: { listId: list.id } })).toBe(0);

      const after = await request(app)
        .get(`/todo/lists/${list.id}/todos`)
        .set(auth(user.body.token));
      expect(after.status).toBe(404);
    });
  });
});
