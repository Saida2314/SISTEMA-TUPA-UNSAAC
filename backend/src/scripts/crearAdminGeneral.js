const bcrypt = require("bcryptjs");
const { poolPromise, sql } = require("../config/db");

async function crearUsuariosPrueba() {
  try {
    const pool = await poolPromise;

    const usuarios = [
      {
        rol: "ADMIN_GENERAL",
        nombres: "Administrador",
        apellidos: "General",
        dni: "00000001",
        correo: "admin.general@unsaac.edu.pe",
        password: "Admin123*"
      },
      {
        rol: "USUARIO",
        nombres: "Juan",
        apellidos: "Pérez",
        dni: "00000002",
        correo: "usuario@unsaac.edu.pe",
        password: "Usuario123*"
      },
      {
        rol: "REVISOR",
        nombres: "Carlos",
        apellidos: "Quispe",
        dni: "00000003",
        correo: "revisor@unsaac.edu.pe",
        password: "Revisor123*"
      },
      {
        rol: "ADMIN_AREA",
        nombres: "María",
        apellidos: "Huamán",
        dni: "00000004",
        correo: "admin.area@unsaac.edu.pe",
        password: "Area123*"
      }
    ];

    for (const user of usuarios) {
      const rolResult = await pool.request()
        .input("rol", sql.NVarChar, user.rol)
        .query(`
          SELECT id_rol
          FROM roles
          WHERE nombre = @rol
        `);

      if (rolResult.recordset.length === 0) {
        console.log(`No existe el rol: ${user.rol}`);
        continue;
      }

      const existe = await pool.request()
        .input("correo", sql.NVarChar, user.correo)
        .input("dni", sql.NVarChar, user.dni)
        .query(`
          SELECT id_usuario
          FROM usuarios
          WHERE correo = @correo OR dni = @dni
        `);

      if (existe.recordset.length > 0) {
        console.log(`Ya existe el usuario: ${user.correo}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 10);

      await pool.request()
        .input("id_rol", sql.Int, rolResult.recordset[0].id_rol)
        .input("nombres", sql.NVarChar, user.nombres)
        .input("apellidos", sql.NVarChar, user.apellidos)
        .input("dni", sql.NVarChar, user.dni)
        .input("correo", sql.NVarChar, user.correo)
        .input("password_hash", sql.NVarChar, passwordHash)
        .query(`
          INSERT INTO usuarios (
            id_rol,
            nombres,
            apellidos,
            dni,
            correo,
            password_hash,
            estado
          )
          VALUES (
            @id_rol,
            @nombres,
            @apellidos,
            @dni,
            @correo,
            @password_hash,
            'ACTIVO'
          )
        `);

      console.log(`Usuario creado: ${user.correo} | Contraseña: ${user.password}`);
    }

    console.log("Proceso terminado correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear usuarios de prueba:");
    console.error(error);
    process.exit(1);
  }
}

crearUsuariosPrueba();