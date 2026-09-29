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

// Un proyecto aprobado con sus integrantes y tecnologías. Devuelve null si no existe.
async function obtenerDetalle(id) {
  const filas = await consultar(
    `SELECT id, titulo, descripcion_corta, descripcion, curso, division, anio, turno,
            materia, estado, destacado, creado, actualizado
       FROM proyectos
      WHERE id = ? AND estado_revision = 'aprobado'`,
    [id]
  );
  if (filas.length === 0) return null;

  const proyecto = filas[0];
  const integrantes = await consultar(
    'SELECT nombre FROM proyecto_integrantes WHERE proyecto_id = ? ORDER BY id',
    [id]
  );
  const tecnologias = await consultar(
    `SELECT t.nombre FROM tecnologias t
       JOIN proyecto_tecnologias pt ON pt.tecnologia_id = t.id
      WHERE pt.proyecto_id = ? ORDER BY t.nombre`,
    [id]
  );
  proyecto.integrantes = integrantes.map((i) => i.nombre);
  proyecto.tecnologias = tecnologias.map((t) => t.nombre);
  return proyecto;
}

async function listarTecnologias() {
  return consultar('SELECT id, nombre FROM tecnologias ORDER BY nombre');
}

module.exports = { listarParaInicio, obtenerDetalle, listarTecnologias };
