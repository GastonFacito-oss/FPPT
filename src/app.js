// Configuración de Express: vistas, archivos públicos, rutas y errores.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const rutas = require('./routes');
const { noEncontrado, errorGeneral } = require('./middlewares/errores');
const { sesion, datosDeSesion, verificarCsrf } = require('./middlewares/sesion');

const app = express();
app.disable('x-powered-by');

// Si hay un servidor HTTPS delante (el de la escuela), se confía en lo que informa:
// la dirección real de cada visitante (para el límite de intentos de login) y si la visita es HTTPS.
if (config.proxyConfiable > 0) app.set('trust proxy', config.proxyConfiable);

// Cabeceras de seguridad. La política de contenido solo deja cargar scripts, estilos,
// imágenes y fuentes del propio sitio, así un texto malicioso no puede ejecutar código.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // algunos estilos van en atributos style=""
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        ...(config.produccion ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    // HSTS: el navegador recuerda que el sitio va siempre por HTTPS (solo en producción)
    strictTransportSecurity: config.produccion,
  })
);

// Vistas con EJS (HTML con datos del servidor)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos públicos: CSS, JS, imágenes y la tipografía Plus Jakarta Sans
// (la tipografía se sirve desde el propio servidor, así funciona sin internet)
// En producción, el navegador guarda estos archivos 1 día (las páginas cargan más rápido)
const cache = { maxAge: config.produccion ? '1d' : 0 };
app.use(express.static(path.join(__dirname, '..', 'public'), cache));
app.use('/fuentes', express.static(path.join(__dirname, '..', 'node_modules', '@fontsource', 'plus-jakarta-sans'), cache));

// Para leer los datos de los formularios
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Datos disponibles en todas las vistas (van antes de todo, así también las páginas de error los tienen)
app.use((req, res, next) => {
  res.locals.rutaActual = req.path;
  res.locals.anioActual = new Date().getFullYear();
  res.locals.modoPrueba = !config.produccion; // muestra ayudas para probar (cuentas de prueba)
  next();
});

// Sesión del usuario, avisos y protección de formularios (CSRF)
app.use(sesion);
app.use(datosDeSesion);
app.use(verificarCsrf);

app.use(rutas);

app.use(noEncontrado);
app.use(errorGeneral);

module.exports = app;
