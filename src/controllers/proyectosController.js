// Detalle de un proyecto y formulario para subir proyectos.
const proyectoModel = require('../models/proyectoModel');
const { obtenerDemo } = require('../data/demo-archivos');
const config = require('../config');

async function detalle(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(); // sigue hasta el 404

  const proyecto = await proyectoModel.obtenerDetalle(id);
  if (!proyecto) return next();

  // Por ahora los archivos son de demostración (ver src/data/demo-archivos.js)
  const demo = obtenerDemo(id);
  const archivos = demo ? { ...demo, cantidad: contarArchivos(demo.arbol) } : null;

  res.render('paginas/proyecto-detalle', { titulo: proyecto.titulo, proyecto, archivos });
}

async function mostrarSubir(req, res) {
  const tecnologias = await proyectoModel.listarTecnologias();
  res.render('paginas/subir', {
    titulo: 'Subir proyecto',
    tecnologias,
    zipMaxMb: config.zipMaxMb,
    anioActual: new Date().getFullYear(),
  });
}

function contarArchivos(nodos) {
  return nodos.reduce((total, nodo) => total + (nodo.hijos ? contarArchivos(nodo.hijos) : 1), 0);
}

module.exports = { detalle, mostrarSubir };
