import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const exports = {};

const parseListId = (value) => parseInt(value, 10);

const normalizeName = (raw) => {
  if (typeof raw !== "string") {
    return { error: "List name is required." };
  }

  const name = raw.trim();
  if (!name) {
    return { error: "List name is required." };
  }

  if (name.length > 100) {
    return { error: "List name must be 100 characters or fewer." };
  }

  return { name };
};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.status(200).send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to fetch lists." });
  }
};

exports.create = async (req, res) => {
  const parsed = normalizeName(req.body?.name);
  if (parsed.error) {
    return res.status(400).send({ message: parsed.error });
  }

  try {
    const list = await db.list.create({
      name: parsed.name,
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (err) {
    logger.error(`List create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  const id = parseListId(req.params.listId);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  const parsed = normalizeName(req.body?.name);
  if (parsed.error) {
    return res.status(400).send({ message: parsed.error });
  }

  try {
    const list = await getAccessibleListOrNull(req, id);
    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    list.name = parsed.name;
    await list.save();
    return res.status(200).send(list);
  } catch (err) {
    logger.error(`List update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.remove = async (req, res) => {
  const id = parseListId(req.params.listId);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "List id is invalid." });
  }

  try {
    const list = await getAccessibleListOrNull(req, id);
    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    await list.destroy();
    return res.status(200).send({ message: "List deleted." });
  } catch (err) {
    logger.error(`List delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
