const { poolPromise, sql } = require("../config/db");

async function listarTramitesPublicos(req, res) {
  try {
    const { categoria, buscar } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT 
        t.id_tramite,
        t.codigo,
        t.nombre,
        t.descripcion,
        t.costo,
        t.plazo_dias,
        t.tipo_plazo,
        t.tipo_entrega,
        c.nombre AS categoria
      FROM tramites t
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      WHERE t.estado = 'ACTIVO'
    `;

    const request = pool.request();

    if (categoria && categoria !== "Todos") {
      query += " AND c.nombre = @categoria";
      request.input("categoria", sql.NVarChar, categoria);
    }
    if (buscar && buscar.trim() !== "") {
      query += `
        AND (
        t.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar COLLATE Modern_Spanish_CI_AI
        OR t.descripcion COLLATE Modern_Spanish_CI_AI LIKE @buscar COLLATE Modern_Spanish_CI_AI
        OR t.codigo COLLATE Modern_Spanish_CI_AI LIKE @buscar COLLATE Modern_Spanish_CI_AI
        OR c.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar COLLATE Modern_Spanish_CI_AI
        )
      `;

      request.input("buscar", sql.NVarChar, `%${buscar.trim()}%`);
    }


    query += " ORDER BY t.id_tramite ASC";

    const result = await request.query(query);

    return res.json(result.recordset);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al listar trámites públicos"
    });
  }
}

async function obtenerTramitePublico(req, res) {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          t.id_tramite,
          t.codigo,
          t.nombre,
          t.descripcion,
          t.costo,
          t.plazo_dias,
          t.tipo_plazo,
          t.tipo_entrega,
          c.nombre AS categoria
        FROM tramites t
        INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
        WHERE t.id_tramite = @id AND t.estado = 'ACTIVO'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Trámite no encontrado"
      });
    }

    return res.json(result.recordset[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al obtener trámite"
    });
  }
}

module.exports = {
  listarTramitesPublicos,
  obtenerTramitePublico
};