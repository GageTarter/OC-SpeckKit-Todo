import request from "supertest";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const validRegisterBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password1",
  ...overrides,
});

export const registerUser = async (app, overrides = {}) => {
  return request(app).post("/todo/register").send(validRegisterBody(overrides));
};
