// Guarda las sesiones de express-session en la tabla "sesiones" de la base (Supabase).
// Así, si se reinicia el servidor, nadie pierde la sesión iniciada.
const session = require('express-session');
const { consultar } = require('./db');

class AlmacenEnBase extends session.Store {
  // Busca una sesión por su id
  get(id, listo) {
    consultar('SELECT datos FROM sesiones WHERE id = $1 AND expira > NOW()', [id])
      .then((filas) => listo(null, filas.length ? JSON.parse(filas[0].datos) : null))
      .catch(listo);
  }

  // Crea o actualiza una sesión
  set(id, datos, listo) {
    const expira = calcularVencimiento(datos);
    consultar(
      `INSERT INTO sesiones (id, datos, expira) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET datos = EXCLUDED.datos, expira = EXCLUDED.expira`,
      [id, JSON.stringify(datos), expira]
    )
      .then(() => listo && listo(null))
      .catch((err) => listo && listo(err));
  }

  // Extiende el vencimiento cuando el usuario sigue navegando
  touch(id, datos, listo) {
    consultar('UPDATE sesiones SET expira = $1 WHERE id = $2', [calcularVencimiento(datos), id])
      .then(() => listo && listo(null))
      .catch((err) => listo && listo(err));
  }

  // Borra una sesión (al cerrar sesión)
  destroy(id, listo) {
    consultar('DELETE FROM sesiones WHERE id = $1', [id])
      .then(() => listo && listo(null))
      .catch((err) => listo && listo(err));
  }
}

function calcularVencimiento(datos) {
  const fecha = datos.cookie && datos.cookie.expires ? new Date(datos.cookie.expires) : new Date(Date.now() + 864e5);
  return fecha;
}

// Limpia las sesiones vencidas una vez por hora
setInterval(() => {
  consultar('DELETE FROM sesiones WHERE expira < NOW()').catch(() => {});
}, 60 * 60 * 1000).unref();

module.exports = AlmacenEnBase;
