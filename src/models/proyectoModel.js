// Consultas a la base de datos relacionadas con proyectos.
const { consultar, transaccion } = require('../config/db');

// Columnas que necesita cada tarjeta. "es_nuevo" = subido en los últimos 7 días.
const COLUMNAS_TARJETA = `id, titulo, descripcion_corta, materia, curso, division, anio, destacado,
  creado >= NOW() - INTERVAL '7 days' AS es_nuevo`;

// Los últimos proyectos publicados: el más nuevo primero.
// Así, cada proyecto que se sube aparece arriba de todo en el Inicio.
async function listarRecientes(limite = 6) {
  return consultar(
    `SELECT ${COLUMNAS_TARJETA}
       FROM proyectos
      WHERE estado_revision = 'aprobado'
      ORDER BY creado DESC, id DESC
      LIMIT $1`,
    [limite]
  );
}

// Destacados que no estén ya en la lista de recientes (para no repetir tarjetas)
async function listarDestacados(excluirIds = [], limite = 3) {
  return consultar(
    `SELECT ${COLUMNAS_TARJETA}
       FROM proyectos
      WHERE estado_revision = 'aprobado' AND destacado AND NOT (id = ANY($1::int[]))
      ORDER BY creado DESC
      LIMIT $2`,
    [excluirIds, limite]
  );
}

// Todos los proyectos publicados, de a "porPagina"
async function listarPagina(pagina = 1, porPagina = 12) {
  const desde = (pagina - 1) * porPagina;
  const [proyectos, [{ total }]] = await Promise.all([
    consultar(
      `SELECT ${COLUMNAS_TARJETA}
         FROM proyectos
        WHERE estado_revision = 'aprobado'
        ORDER BY creado DESC, id DESC
        LIMIT $1 OFFSET $2`,
      [porPagina, desde]
    ),
    consultar(`SELECT COUNT(*) AS total FROM proyectos WHERE estado_revision = 'aprobado'`),
  ]);
  return { proyectos, total: Number(total) };
}

// Un proyecto publicado con sus integrantes, tecnologías y ZIP. Devuelve null si no existe.
async function obtenerDetalle(id) {
  const filas = await consultar(
    `SELECT id, titulo, descripcion_corta, descripcion, curso, division, anio, turno,
            materia, estado, destacado, creado, actualizado
       FROM proyectos
      WHERE id = $1 AND estado_revision = 'aprobado'`,
    [id]
  );
  if (filas.length === 0) return null;

  const proyecto = filas[0];
  const [integrantes, tecnologias, zip] = await Promise.all([
    consultar('SELECT nombre FROM proyecto_integrantes WHERE proyecto_id = $1 ORDER BY id', [id]),
    consultar(
      `SELECT t.nombre FROM tecnologias t
         JOIN proyecto_tecnologias pt ON pt.tecnologia_id = t.id
        WHERE pt.proyecto_id = $1 ORDER BY t.nombre`,
      [id]
    ),
    obtenerZip(id),
  ]);
  proyecto.integrantes = integrantes.map((i) => i.nombre);
  proyecto.tecnologias = tecnologias.map((t) => t.nombre);
  proyecto.zip = zip;
  return proyecto;
}

// Datos del ZIP de un proyecto publicado (o null si no tiene)
async function obtenerZip(proyectoId) {
  const filas = await consultar(
    `SELECT z.nombre_original, z.ruta, z.tamanio, z.arbol_json AS arbol, z.subido
       FROM archivos_zip z
       JOIN proyectos p ON p.id = z.proyecto_id
      WHERE z.proyecto_id = $1 AND p.estado_revision = 'aprobado'`,
    [proyectoId]
  );
  if (filas.length === 0) return null;
  const zip = filas[0];
  zip.tamanio = Number(zip.tamanio); // BIGINT llega como texto
  return zip;
}

async function listarTecnologias() {
  return consultar('SELECT id, nombre FROM tecnologias ORDER BY nombre');
}

// Guarda un proyecto nuevo con todo lo relacionado.
// Usa una transacción: o se guarda todo, o no se guarda nada.
async function crear({ datos, creadorId, propietariosIds, zip }) {
  return transaccion(async (cliente) => {
    // Por ahora se publica al instante ('aprobado'). Cuando exista el panel de
    // docentes se puede guardar como 'pendiente' para que lo revisen antes.
    const { rows } = await cliente.query(
      `INSERT INTO proyectos
         (titulo, descripcion_corta, descripcion, curso, division, anio, turno, materia, estado, estado_revision, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aprobado', $10)
       RETURNING id`,
      [datos.titulo, datos.descripcion_corta, datos.descripcion, datos.curso, datos.division,
        datos.anio, datos.turno, datos.materia, datos.estado, creadorId]
    );
    const id = rows[0].id;

    for (const usuarioId of new Set([creadorId, ...propietariosIds])) {
      await cliente.query('INSERT INTO proyecto_propietarios (proyecto_id, usuario_id) VALUES ($1, $2)', [id, usuarioId]);
    }
    for (const nombre of datos.integrantes) {
      await cliente.query('INSERT INTO proyecto_integrantes (proyecto_id, nombre) VALUES ($1, $2)', [id, nombre]);
    }
    for (const tecnologiaId of datos.tecnologias) {
      await cliente.query('INSERT INTO proyecto_tecnologias (proyecto_id, tecnologia_id) VALUES ($1, $2)', [id, tecnologiaId]);
    }
    await cliente.query(
      `INSERT INTO archivos_zip (proyecto_id, nombre_original, ruta, tamanio, arbol_json, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      // JSON.stringify: el árbol se guarda como JSON (si no, pg lo convertiría en un array de PostgreSQL)
      [id, zip.nombreOriginal, zip.ruta, zip.tamanio, JSON.stringify(zip.arbol), creadorId]
    );
    return id;
  });
}

module.exports = {
  listarRecientes,
  listarDestacados,
  listarPagina,
  obtenerDetalle,
  obtenerZip,
  listarTecnologias,
  crear,
};
