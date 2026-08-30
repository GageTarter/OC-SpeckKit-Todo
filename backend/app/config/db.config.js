import "dotenv/config";

function mysqlHostPort() {
  const rawHost = process.env.DB_HOST || "localhost";
  const rawPort = process.env.DB_PORT;
  let host = rawHost;
  let port = rawPort ? Number(rawPort) : 3306;

  const colon = rawHost.lastIndexOf(":");
  if (colon !== -1) {
    const maybePort = rawHost.slice(colon + 1);
    if (/^\d+$/.test(maybePort)) {
      host = rawHost.slice(0, colon);
      if (!rawPort) {
        port = Number(maybePort);
      }
    }
  }

  return { host, port };
}

const { host, port } = mysqlHostPort();

const dbConfig = {
  HOST: host,
  PORT: port,
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PW || "",
  DB: process.env.DB_NAME || "speckit-db",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export default dbConfig;
