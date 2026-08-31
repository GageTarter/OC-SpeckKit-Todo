import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const exports = {};

const parseId = (value) => parseInt(value, 10);

const normalizeTitle = (raw) => {
  if (typeof raw !== "string") {
    return { error: "Todo title is required." };
  }

  const title = raw.trim();
  if (!title) {
    return { error: "Todo title is required." };
  }

  if (title.length > 255) {
    return { error: "Todo title must be 255 characters or fewer." };
  }

  return { title };
};

const notFoundList = (res, id) =>
  res.status(404).send({ message: `List with id=${id} not found.` });

const notFoundTodo = (res, id) =>
  res.status(404).send({ message: `Todo with id=${id} not found.` });

exports.findAllForList = async (req, res) => {
  const listId = parseId(req.params.listId);
  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return notFoundList(res, listId);
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.status(200).send(todos);
  } catch (err) {
    logger.error(`Todo findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to fetch todos." });
  }
};

exports.createForList = async (req, res) => {
  const listId = parseId(req.params.listId);
  if (Number.isNaN(listId)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  const parsed = normalizeTitle(req.body?.title);
  if (parsed.error) {
    return res.status(400).send({ message: parsed.error });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return notFoundList(res, listId);
    }

    const todo = await db.todo.create({
      title: parsed.title,
      completed: false,
      listId: list.id,
      userId: req.user.id,
    });
    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`Todo create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  const id = parseId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "Todo id is invalid." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return notFoundTodo(res, id);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const parsed = normalizeTitle(req.body.title);
      if (parsed.error) {
        return res.status(400).send({ message: parsed.error });
      }
      todo.title = parsed.title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`Todo update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "Todo id is invalid." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, id);
    if (!todo) {
      return notFoundTodo(res, id);
    }

    await todo.destroy();
    return res.status(200).send({ message: "Todo deleted." });
  } catch (err) {
    logger.error(`Todo delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
