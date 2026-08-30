import { Sequelize } from "sequelize";
import request from "supertest";
import db from "../app/models/index.js";
import dbConfig from "../app/config/db.config.js";

let testDatabaseEnsured = false;

const ensureTestDatabase = async () => {
  if (testDatabaseEnsured) {
    return;
  }

  const name = dbConfig.DB;
  if (!/^[\w-]+$/.test(name)) {
    throw new Error(`Invalid DB_NAME: ${name}`);
  }

  const admin = new Sequelize({
    username: dbConfig.USER,
    password: dbConfig.PASSWORD,
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: "mysql",
    logging: false,
  });

  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${name}\`;`);
  await admin.close();
  testDatabaseEnsured = true;
};

export const syncTestDatabase = async () => {
  await ensureTestDatabase();
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
