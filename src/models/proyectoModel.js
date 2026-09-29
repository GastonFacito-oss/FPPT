// Consultas a la base de datos relacionadas con proyectos.
const { consultar } = require('../config/db');

// Proyectos aprobados para mostrar en el Inicio.
// destacado = 1 primero, después los más recientes.
async function listarParaInicio(limite = 6) {
  return consultar(
    `SELECT id, titulo, descripcion_corta, materia, curso, division, anio, destacado
       FROM proyectos
      WHERE estado_revision = 'aprobado'
      ORDER BY destacado DESC, creado DESC
      LIMIT ${Number(limite)}`
  );
}

module.exports = { listarParaInicio };
