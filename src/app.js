// Configuración de Express: vistas, archivos públicos, rutas y errores.
const path = require('path');
const express = require('express');
const config = require('./config');
const rutas = require('./routes');
const { noEncontrado, errorGeneral } = require('./middlewares/errores');
const { sesion, datosDeSesion, verificarCsrf } = require('./middlewares/sesion');

const app = express();
app.disable('x-powered-by');

// Vistas con EJS (HTML con datos del servidor)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos públicos: CSS, JS, imágenes y la tipografía Plus Jakarta Sans
// (la tipografía se sirve desde el propio servidor, así funciona sin internet)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/fuentes', express.static(path.join(__dirname, '..', 'node_modules', '@fontsource', 'plus-jakarta-sans')));

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
