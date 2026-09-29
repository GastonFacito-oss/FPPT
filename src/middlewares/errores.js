// Páginas de error: 404 (no existe) y 500 (algo falló en el servidor).

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
  console.error(err);
  // Por si el error ocurrió antes de cargar la sesión (por ejemplo, la base está apagada)
  res.locals.usuario = res.locals.usuario || null;
  res.locals.avisos = res.locals.avisos || [];
  res.locals.csrf = res.locals.csrf || '';
  res.status(500).render('paginas/error', {
    titulo: 'Error del servidor',
    codigo: 500,
    mensaje: 'Ocurrió un problema. Probá de nuevo en unos minutos.',
  });
}

module.exports = { noEncontrado, errorGeneral };
