// Controles de acceso.
const { avisar, esPedidoJs } = require('./sesion');

// Solo usuarios con sesión iniciada. Si no, los manda a "Ingresar"
// y después del login los devuelve a la página que querían ver.
function requiereLogin(req, res, next) {
  if (req.session.usuario) return next();
  if (esPedidoJs(req)) {
    return res.status(401).json({ ok: false, mensaje: 'Tu sesión se cerró. Iniciá sesión de nuevo y volvé a subir el proyecto.' });
  }
  avisar(req, 'aviso', 'Iniciá sesión para continuar.');
  res.redirect('/ingresar?volver=' + encodeURIComponent(req.originalUrl));
}

// Solo ciertos roles, por ejemplo: requiereRol('docente', 'admin')
function requiereRol(...roles) {
  return (req, res, next) => {
    const usuario = req.session.usuario;
    if (usuario && roles.includes(usuario.rol)) return next();
    res.status(403).render('paginas/error', {
      titulo: 'Sin permiso',
      codigo: 403,
      mensaje: 'Tu cuenta no tiene permiso para ver esta página.',
    });
  };
}

// Para "Ingresar" y "Crear cuenta": si ya inició sesión, no tiene sentido mostrarlas
function soloInvitados(req, res, next) {
  if (!req.session.usuario) return next();
  res.redirect('/');
}

module.exports = { requiereLogin, requiereRol, soloInvitados };
