// Todo lo relacionado a la sesión del usuario:
// - configurar express-session
// - dejar el usuario, los avisos y el token de seguridad disponibles en las vistas
const crypto = require('crypto');
const session = require('express-session');
const config = require('../config');
const AlmacenMySQL = require('../config/sesiones');

const sesion = session({
  name: 'fppt.sid',
  secret: config.sesionSecreto,
  store: new AlmacenMySQL(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,              // JavaScript del navegador no puede leer la cookie
    sameSite: 'lax',
    secure: config.produccion && process.env.HTTPS === '1',
    maxAge: 8 * 60 * 60 * 1000,  // 8 horas
  },
});

// Datos para todas las vistas
function datosDeSesion(req, res, next) {
  res.locals.usuario = req.session.usuario || null;

  // Avisos de una sola vez ("flash"): se muestran y se borran
  res.locals.avisos = req.session.avisos || [];
  delete req.session.avisos;

  // Token contra CSRF: cada formulario POST tiene que mandarlo
  res.locals.csrf = req.session.csrf || '';
  next();
}

// Crea el token CSRF. Se usa solo en las páginas con formularios,
// así no se guarda una sesión por cada visitante que solo mira proyectos.
function prepararCsrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = nuevoToken();
  res.locals.csrf = req.session.csrf;
  next();
}

function nuevoToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Guarda un aviso para mostrar en la próxima página
// tipo: 'exito' | 'error' | 'aviso'
function avisar(req, tipo, texto) {
  req.session.avisos = [...(req.session.avisos || []), { tipo, texto }];
}

// Rechaza los formularios que no traen el token correcto
function verificarCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  const enviado = Buffer.from(String((req.body && req.body._csrf) || ''));
  const esperado = Buffer.from(String(req.session.csrf || ''));
  const valido =
    esperado.length > 0 &&
    enviado.length === esperado.length &&
    crypto.timingSafeEqual(enviado, esperado);
  if (!valido) {
    return res.status(403).render('paginas/error', {
      titulo: 'Formulario vencido',
      codigo: 403,
      mensaje: 'El formulario venció. Volvé atrás, recargá la página y probá de nuevo.',
    });
  }
  next();
}

module.exports = { sesion, datosDeSesion, prepararCsrf, nuevoToken, avisar, verificarCsrf };
