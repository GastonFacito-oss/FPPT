// Mapa de direcciones del sitio: qué controlador responde a cada URL.
const express = require('express');
const paginas = require('../controllers/paginasController');

const router = express.Router();

router.get('/', paginas.inicio);
router.get('/sobre-fppt', paginas.sobre);
router.get('/ayuda', paginas.ayuda);
router.get('/componentes', paginas.componentes);
router.get('/salud', paginas.salud);

// Secciones que se construyen en los próximos sprints
router.get('/proyectos', paginas.enConstruccion('Proyectos', 3));
router.get('/subir', paginas.enConstruccion('Subir proyecto', 3));
router.get('/ingresar', paginas.enConstruccion('Ingresar', 2));
router.get('/registro', paginas.enConstruccion('Crear cuenta', 2));

module.exports = router;
