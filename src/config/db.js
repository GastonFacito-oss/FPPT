// Conexión a MySQL / MariaDB.
// Usamos un "pool": un grupo de conexiones que se reutilizan entre pedidos.
const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
});

// Ejecuta una consulta con parámetros (los "?" se reemplazan de forma segura).
// Ejemplo: consultar('SELECT * FROM usuarios WHERE id = ?', [5])
async function consultar(sql, parametros = []) {
  const [filas] = await pool.execute(sql, parametros);
  return filas;
}

// Devuelve true si la base responde. Se usa en /salud.
async function probarConexion() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, consultar, probarConexion };
