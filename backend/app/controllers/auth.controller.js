import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const exports = {};

const requiredString = (value) => typeof value === "string" && value.trim().length > 0;

const authPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const issueOrReuseSession = async (user) => {
  const existing = await db.session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gte]: new Date() },
      token: { [Op.ne]: "" },
    },
  });

  if (existing) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });

  await db.session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_MS),
    userId: user.id,
  });

  return token;
};

exports.register = async (req, res) => {
  const fName = typeof req.body.fName === "string" ? req.body.fName.trim() : "";
  const lName = typeof req.body.lName === "string" ? req.body.lName.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const username =
    typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email) {
    return res.status(400).send({ message: "Email is required." });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!fName) {
    return res.status(400).send({ message: "First name is required." });
  }

  if (!lName) {
    return res.status(400).send({ message: "Last name is required." });
  }

  if (!password.trim()) {
    return res.status(400).send({ message: "Password is required." });
  }

  if (password.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  try {
    const takenUsername = await db.user.findOne({ where: { username } });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await db.user.findOne({ where: { email } });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.user.create({
      fName,
      lName,
      email,
      username,
      password: hashedPassword,
      role: "worker",
    });

    const token = await issueOrReuseSession(user);
    return res.status(201).send(authPayload(user, token));
  } catch (err) {
    logger.error(`Registration failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  const username =
    typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!username) {
    return res.status(400).send({ message: "Username is required." });
  }

  if (!requiredString(password)) {
    return res.status(400).send({ message: "Password is required." });
  }

  try {
    const user = await db.user.unscoped().findOne({ where: { username } });

    if (!user) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await issueOrReuseSession(user);
    return res.status(200).send(authPayload(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  const authHeader = req.get("Authorization") || "";
  const token = authHeader.split(" ")[1];

  try {
    const session = await db.session.findOne({ where: { token } });
    if (session) {
      session.token = "";
      await session.save();
    }

    return res.status(200).send({ message: "Signed out." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
