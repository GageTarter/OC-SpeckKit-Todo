import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const exports = {};

const parseUserId = (value) => parseInt(value, 10);

const toProfile = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const notFound = (res, id) =>
  res.status(404).send({ message: `User with id=${id} not found.` });

exports.findOne = async (req, res) => {
  const id = parseUserId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "User id is invalid." });
  }

  try {
    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return notFound(res, id);
    }
    return res.status(200).send(toProfile(user));
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to fetch profile." });
  }
};

exports.update = async (req, res) => {
  const id = parseUserId(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).send({ message: "User id is invalid." });
  }

  const hasPassword =
    Object.prototype.hasOwnProperty.call(req.body, "password") &&
    req.body.password !== "" &&
    req.body.password != null;

  if (hasPassword) {
    if (typeof req.body.password !== "string" || req.body.password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }
  }

  const fName = typeof req.body.fName === "string" ? req.body.fName.trim() : "";
  const lName = typeof req.body.lName === "string" ? req.body.lName.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const username =
    typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";

  if (!fName) {
    return res.status(400).send({ message: "First name is required." });
  }

  if (!lName) {
    return res.status(400).send({ message: "Last name is required." });
  }

  if (!email) {
    return res.status(400).send({ message: "Email is required." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  try {
    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return notFound(res, id);
    }

    const takenUsername = await db.user.findOne({
      where: { username, id: { [Op.ne]: user.id } },
    });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await db.user.findOne({
      where: { email, id: { [Op.ne]: user.id } },
    });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = fName;
    user.lName = lName;
    user.email = email;
    user.username = username;

    if (hasPassword) {
      const withPassword = await db.user.unscoped().findByPk(user.id);
      withPassword.fName = fName;
      withPassword.lName = lName;
      withPassword.email = email;
      withPassword.username = username;
      withPassword.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
      await withPassword.save();
      const refreshed = await db.user.findByPk(user.id);
      return res.status(200).send(toProfile(refreshed));
    }

    await user.save();
    return res.status(200).send(toProfile(user));
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
