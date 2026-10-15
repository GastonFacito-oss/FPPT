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

// ¿El token recibido (del formulario o del encabezado X-CSRF-Token) es el de esta sesión?
function tokenValido(req) {
  const recibido = (req.body && req.body._csrf) || req.get('X-CSRF-Token') || '';
  const enviado = Buffer.from(String(recibido));
  const esperado = Buffer.from(String(req.session.csrf || ''));
  return esperado.length > 0 && enviado.length === esperado.length && crypto.timingSafeEqual(enviado, esperado);
}

function rechazarFormulario(req, res) {
  const mensaje = 'El formulario venció. Recargá la página y probá de nuevo.';
  if (esPedidoJs(req)) return res.status(403).json({ ok: false, mensaje });
  res.status(403).render('paginas/error', { titulo: 'Formulario vencido', codigo: 403, mensaje });
}

// Rechaza los formularios que no traen el token correcto
function verificarCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  // La subida de proyectos llega como "multipart" (con archivo): su token se revisa
  // en src/middlewares/subida.js, antes de guardar el archivo.
  if (req.path === '/subir' && req.is('multipart/form-data')) return next();
  if (!tokenValido(req)) return rechazarFormulario(req, res);
  next();
}

// Pedidos hechos desde JavaScript (por ejemplo, la subida con barra de progreso):
// esperan una respuesta en JSON en lugar de una página
function esPedidoJs(req) {
  return req.get('X-Requested-With') === 'fetch';
}

module.exports = { sesion, datosDeSesion, prepararCsrf, nuevoToken, avisar, verificarCsrf, tokenValido, rechazarFormulario, esPedidoJs };
