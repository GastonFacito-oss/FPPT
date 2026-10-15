// Consultas a la base de datos relacionadas con usuarios.
const { consultar } = require('../config/db');

async function buscarPorEmail(email) {
  const filas = await consultar(
    'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?',
    [email]
  );
  return filas[0] || null;
}

// Devuelve qué datos ya están usados por otra cuenta: { email: true/false, dni: true/false }
async function datosRepetidos(email, dni) {
  const filas = await consultar('SELECT email, dni FROM usuarios WHERE email = ? OR dni = ?', [email, dni]);
  return {
    email: filas.some((f) => f.email === email),
    dni: filas.some((f) => f.dni === dni),
  };
}

// Crea un estudiante y devuelve su id
async function crear({ nombre, email, dni, passwordHash }) {
  const resultado = await consultar(
    'INSERT INTO usuarios (nombre, email, dni, password_hash) VALUES (?, ?, ?, ?)',
    [nombre, email, dni, passwordHash]
  );
  return resultado.insertId;
}

// Busca varias cuentas por email (para agregar compañeros como propietarios de un proyecto)
async function buscarPorEmails(emails) {
  if (emails.length === 0) return [];
  const marcas = emails.map(() => '?').join(', ');
  return consultar(`SELECT id, email FROM usuarios WHERE activo = 1 AND email IN (${marcas})`, emails);
}

module.exports = { buscarPorEmail, datosRepetidos, crear, buscarPorEmails };
