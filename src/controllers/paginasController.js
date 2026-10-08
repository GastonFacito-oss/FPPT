// Controlador de las páginas generales del sitio.
const proyectoModel = require('../models/proyectoModel');
const { probarConexion } = require('../config/db');
const config = require('../config');

async function inicio(req, res) {
  let recientes = [];
  let destacados = [];
  let baseDisponible = true;
  try {
    // Los últimos subidos van primero: cada proyecto nuevo aparece arriba de todo
    recientes = await proyectoModel.listarRecientes(6);
    destacados = await proyectoModel.listarDestacados(recientes.map((p) => p.id), 3);
  } catch (err) {
    // Si la base no está encendida, la página igual se muestra con un aviso.
    console.error('No se pudo leer la base de datos:', err.message);
    baseDisponible = false;
  }
  res.render('paginas/inicio', { titulo: 'Inicio', recientes, destacados, baseDisponible });
}

function sobre(req, res) {
  res.render('paginas/sobre', { titulo: 'Sobre FPPT' });
}

function ayuda(req, res) {
  res.render('paginas/ayuda', { titulo: 'Ayuda', zipMaxMb: config.zipMaxMb });
}

// Guía visual del sistema de diseño (colores, tipografía, botones, formularios...)
function componentes(req, res) {
  res.render('paginas/componentes', { titulo: 'Sistema de diseño' });
}

// Estado del servidor y de la base de datos, en formato JSON.
async function salud(req, res) {
  const baseDatos = await probarConexion();
  res.status(baseDatos ? 200 : 503).json({ servidor: 'ok', baseDatos: baseDatos ? 'ok' : 'sin conexión' });
}

module.exports = { inicio, sobre, ayuda, componentes, salud };
