// Conexión a la base de datos PostgreSQL (Supabase).
// Usamos un "pool": un grupo de conexiones que se reutilizan entre pedidos.
const fs = require('fs');
const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  connectionString: direccionSinSslmode(config.db.url),
  ssl: opcionesSsl(),
  max: config.db.conexiones,
  idleTimeoutMillis: 10000, // libera las conexiones que no se usan (Supabase tiene pocas)
  connectionTimeoutMillis: 10000, // si la base no responde en 10 s, se avisa
});

// Si Supabase corta una conexión que estaba sin usar, se avisa en la consola
// (sin esto, el servidor entero se cerraría)
pool.on('error', (err) => console.error('Se cortó una conexión con la base de datos:', err.message));

// Ejecuta una consulta con parámetros: $1, $2... se reemplazan de forma segura.
// Ejemplo: consultar('SELECT * FROM usuarios WHERE id = $1', [5])
async function consultar(sql, parametros = []) {
  const resultado = await pool.query(sql, parametros);
  return resultado.rows;
}

// Ejecuta varias consultas como una sola: o se guardan todas, o ninguna.
// "trabajo" recibe un cliente y usa cliente.query(...) igual que pool.query.
async function transaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
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

// ¿Este error significa que no se puede usar la base (apagada, sin internet, mal configurada)?
const CODIGOS_SIN_BASE = [
  'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET',
  '28P01', '28000', // usuario o contraseña incorrectos
  '3D000', // la base no existe
  '42P01', // falta una tabla: no se ejecutó "npm run db:crear"
  '57P01', '57P03', // la base se está apagando o no acepta conexiones
  'XX000', // error del intermediario de Supabase (por ejemplo, proyecto pausado)
];
function esErrorDeBase(err) {
  return CODIGOS_SIN_BASE.includes(err.code) || /timeout|certificate|SSL|Tenant or user/i.test(err.message || '');
}

// SSL = conexión cifrada. Supabase la exige; una base local no la necesita.
function opcionesSsl() {
  const { url, ssl, certificado } = config.db;
  const host = new URL(url).hostname;
  const esLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
  if (ssl === 'no' || (ssl === 'auto' && esLocal)) return false;
  // Con el certificado de Supabase se verifica que del otro lado esté de verdad Supabase
  if (certificado) return { ca: fs.readFileSync(certificado, 'utf8') };
  // Sin certificado: la conexión va cifrada, pero no se verifica quién responde
  return { rejectUnauthorized: false };
}

// Si la dirección trae "sslmode", pg ignoraría las opciones de arriba: se saca
function direccionSinSslmode(url) {
  const direccion = new URL(url);
  direccion.searchParams.delete('sslmode');
  direccion.searchParams.delete('uselibpqcompat');
  return direccion.toString();
}

module.exports = { pool, consultar, transaccion, probarConexion, esErrorDeBase };
