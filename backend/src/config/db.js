const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    instanceName: process.env.DB_INSTANCE,
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Conectado a SQL Server");
    console.log("Servidor:", process.env.DB_SERVER);
    console.log("Instancia:", process.env.DB_INSTANCE);
    console.log("Base de datos:", process.env.DB_DATABASE);
    return pool;
  })
  .catch((err) => {
    console.error("Error de conexión a SQL Server:");
    console.error(err.message);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};