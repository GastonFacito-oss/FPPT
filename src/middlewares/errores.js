// Páginas de error: 404 (no existe) y 500 (algo falló en el servidor).

const { esErrorDeBase } = require('../config/db');

function noEncontrado(req, res) {
  res.status(404).render('paginas/error', {
    titulo: 'Página no encontrada',
    codigo: 404,
    mensaje: 'La página que buscás no existe o fue movida.',
  });
}

// Express reconoce este middleware como manejador de errores por tener 4 parámetros.
// eslint-disable-next-line no-unused-vars
function errorGeneral(err, req, res, next) {
  const esDeBase = esErrorDeBase(err);
  console.error(esDeBase ? `Base de datos no disponible (${err.code}): ${err.message}` : err);

  // Si la respuesta ya se empezó a enviar (por ejemplo, falló guardar la sesión
  // después de mostrar la página), no se puede mandar otra. Si quedó a medio
  // enviar, se corta la conexión; si ya terminó, no hay nada más que hacer.
  if (res.headersSent) {
    if (!res.writableEnded) res.destroy();
    return;
  }

  // Por si el error ocurrió antes de cargar la sesión (por ejemplo, la base está apagada)
  res.locals.usuario = res.locals.usuario || null;
  res.locals.avisos = res.locals.avisos || [];
  res.locals.csrf = res.locals.csrf || '';

  res.status(esDeBase ? 503 : 500).render('paginas/error', {
    titulo: esDeBase ? 'Base de datos no disponible' : 'Error del servidor',
    codigo: esDeBase ? 503 : 500,
    mensaje: esDeBase
      ? 'No se pudo conectar con la base de datos. Revisá la dirección DATABASE_URL del archivo .env, que haya internet y que el proyecto de Supabase no esté pausado. Si es la primera vez, ejecutá "npm run db:crear".'
      : 'Ocurrió un problema. Probá de nuevo en unos minutos.',
  });
}

module.exports = { noEncontrado, errorGeneral };
