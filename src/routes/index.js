// Mapa de direcciones del sitio: qué controlador responde a cada URL.
const express = require('express');
const paginas = require('../controllers/paginasController');
const auth = require('../controllers/authController');
const proyectos = require('../controllers/proyectosController');
const { requiereLogin, soloInvitados } = require('../middlewares/auth');
const { prepararCsrf } = require('../middlewares/sesion');

const router = express.Router();

// Páginas generales
router.get('/', paginas.inicio);
router.get('/sobre-fppt', paginas.sobre);
router.get('/ayuda', paginas.ayuda);
router.get('/componentes', paginas.componentes);
router.get('/salud', paginas.salud);

// Cuentas
router.get('/ingresar', soloInvitados, prepararCsrf, auth.mostrarIngresar);
router.post('/ingresar', soloInvitados, auth.ingresar);
router.get('/registro', soloInvitados, prepararCsrf, auth.mostrarRegistro);
router.post('/registro', soloInvitados, auth.registrar);
router.post('/salir', auth.salir);

// Proyectos
router.get('/proyectos/:id', proyectos.detalle);
router.get('/subir', requiereLogin, prepararCsrf, proyectos.mostrarSubir);

// Secciones que se construyen en los próximos sprints
router.get('/proyectos', paginas.enConstruccion('Proyectos', 3));

module.exports = router;
