const mysql = require("mysql2/promise");
require("dotenv").config();

const isTiDB = (process.env.DB_HOST || "").toLowerCase().includes("tidbcloud.com");
const isSSLRequired = process.env.DB_SSL === "true" || isTiDB;

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (isSSLRequired) {
  poolConfig.ssl = {
    minVersion: "TLSv1.2",
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;