import db from "../models/index.js";

/**
 * Validates Bearer token against the sessions table and sets req.user.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.get("Authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  try {
    const session = await db.session.findOne({
      where: { token },
      include: [{ model: db.user, as: "user" }],
    });

    if (!session || !session.user || session.expirationDate < new Date()) {
      return res.status(401).send({
        message: "Unauthorized! Invalid or expired session.",
      });
    }

    req.user = { id: session.user.id, role: session.user.role };
    return next();
  } catch {
    return res.status(401).send({
      message: "Unauthorized! Invalid or expired session.",
    });
  }
};

export const getAccessibleListOrNull = async (req, listId) => {
  const row = await db.list.findOne({
    where: { id: listId, userId: req.user.id },
  });
  return row ?? null;
};

export const getAccessibleTodoOrNull = async (req, todoId) => {
  const row = await db.todo.findOne({
    where: { id: todoId, userId: req.user.id },
  });
  return row ?? null;
};
