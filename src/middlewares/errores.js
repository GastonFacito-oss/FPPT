// Páginas de error: 404 (no existe) y 500 (algo falló en el servidor).

// Errores de mysql2 que indican que no se puede usar la base de datos
const ERRORES_DE_BASE = ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'];

function noEncontrado(req, res) {
  res.status(404).render('paginas/error', {
    titulo: 'Página no encontrada',
    codigo: 404,
    mensaje: 'La página que buscás no existe o fue movida.',
  });
}

// Express reconoce este middleware como manejador de errores por tener 4 parámetros.
function errorGeneral(err, req, res, next) {
  const esDeBase = ERRORES_DE_BASE.includes(err.code);
  console.error(esDeBase ? `Base de datos no disponible (${err.code}): ${err.message}` : err);

  // Si la respuesta ya se empezó a enviar (por ejemplo, falló guardar la sesión
  // después de mostrar la página), no se puede mandar otra: Express corta la conexión.
  if (res.headersSent) return next(err);

  // Por si el error ocurrió antes de cargar la sesión (por ejemplo, la base está apagada)
  res.locals.usuario = res.locals.usuario || null;
  res.locals.avisos = res.locals.avisos || [];
  res.locals.csrf = res.locals.csrf || '';

  res.status(esDeBase ? 503 : 500).render('paginas/error', {
    titulo: esDeBase ? 'Base de datos no disponible' : 'Error del servidor',
    codigo: esDeBase ? 503 : 500,
    mensaje: esDeBase
      ? 'No se pudo conectar con la base de datos. Revisá que MySQL esté encendido en XAMPP y que ya hayas ejecutado "npm run db:crear".'
      : 'Ocurrió un problema. Probá de nuevo en unos minutos.',
  });
}

module.exports = { noEncontrado, errorGeneral };
