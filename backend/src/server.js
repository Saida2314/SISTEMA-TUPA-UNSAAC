require("dotenv").config();

const app = require("./app");
const { poolPromise } = require("./config/db");

const PORT = process.env.PORT || 3001;

async function iniciarServidor() {
  try {
    await poolPromise;

    app.listen(PORT, () => {
      console.log(`Servidor backend ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor porque falló la conexión a SQL Server");
    console.error(error.message);
  }
}

iniciarServidor();