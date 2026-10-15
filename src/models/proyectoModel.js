// Consultas a la base de datos relacionadas con proyectos.
const { pool, consultar } = require('../config/db');

// Columnas que necesita cada tarjeta. "es_nuevo" = subido en los últimos 7 días.
const COLUMNAS_TARJETA = `id, titulo, descripcion_corta, materia, curso, division, anio, destacado,
  creado >= NOW() - INTERVAL 7 DAY AS es_nuevo`;

// Los últimos proyectos publicados: el más nuevo primero.
// Así, cada proyecto que se sube aparece arriba de todo en el Inicio.
async function listarRecientes(limite = 6) {
  return consultar(
    `SELECT ${COLUMNAS_TARJETA}
       FROM proyectos
      WHERE estado_revision = 'aprobado'
      ORDER BY creado DESC, id DESC
      LIMIT ${Number(limite)}`
  );
}

// Destacados que no estén ya en la lista de recientes (para no repetir tarjetas)
async function listarDestacados(excluirIds = [], limite = 3) {
  const excluir = excluirIds.length ? `AND id NOT IN (${excluirIds.map(Number).join(', ')})` : '';
  return consultar(
    `SELECT ${COLUMNAS_TARJETA}
       FROM proyectos
      WHERE estado_revision = 'aprobado' AND destacado = 1 ${excluir}
      ORDER BY creado DESC
      LIMIT ${Number(limite)}`
  );
}

// Busca entre los proyectos publicados, de a "porPagina".
// filtros = { palabras, q, materia, curso, anio, tecnologia } (ver limpiarBusqueda)
// Sin filtros, devuelve todos los proyectos, los más nuevos primero.
async function buscar(filtros, pagina = 1, porPagina = 12) {
  const condiciones = ["p.estado_revision = 'aprobado'"];
  const parametros = [];

  // Cada palabra tiene que aparecer en el nombre, las descripciones, la materia,
  // los integrantes o las tecnologías. MySQL no distingue mayúsculas ni tildes.
  // Si la palabra es un año (4 números), también se busca por año.
  for (const palabra of filtros.palabras) {
    const patron = '%' + escaparLike(palabra) + '%';
    const esAnio = /^\d{4}$/.test(palabra);
    condiciones.push(`(
      p.titulo LIKE ? ESCAPE '!' OR p.descripcion_corta LIKE ? ESCAPE '!' OR p.descripcion LIKE ? ESCAPE '!'
      OR p.materia LIKE ? ESCAPE '!'
      OR EXISTS (SELECT 1 FROM proyecto_integrantes i
                  WHERE i.proyecto_id = p.id AND i.nombre LIKE ? ESCAPE '!')
      OR EXISTS (SELECT 1 FROM proyecto_tecnologias pt JOIN tecnologias t ON t.id = pt.tecnologia_id
                  WHERE pt.proyecto_id = p.id AND t.nombre LIKE ? ESCAPE '!')
      ${esAnio ? 'OR p.anio = ?' : ''}
    )`);
    parametros.push(patron, patron, patron, patron, patron, patron);
    if (esAnio) parametros.push(Number(palabra));
  }
  if (filtros.materia) { condiciones.push('p.materia = ?'); parametros.push(filtros.materia); }
  if (filtros.curso) { condiciones.push('p.curso = ?'); parametros.push(filtros.curso); }
  if (filtros.anio) { condiciones.push('p.anio = ?'); parametros.push(filtros.anio); }
  if (filtros.tecnologia) {
    condiciones.push('EXISTS (SELECT 1 FROM proyecto_tecnologias pt WHERE pt.proyecto_id = p.id AND pt.tecnologia_id = ?)');
    parametros.push(filtros.tecnologia);
  }
  const donde = condiciones.join(' AND ');

  // Primero los que tienen la búsqueda completa en el nombre; después, los más nuevos
  const enTitulo = '%' + escaparLike(filtros.q || '') + '%';
  const desde = (Number(pagina) - 1) * Number(porPagina);
  const [proyectos, [{ total }]] = await Promise.all([
    consultar(
      `SELECT ${COLUMNAS_TARJETA}
         FROM proyectos p
        WHERE ${donde}
        ORDER BY (p.titulo LIKE ? ESCAPE '!') DESC, p.creado DESC, p.id DESC
        LIMIT ${Number(porPagina)} OFFSET ${desde}`,
      [...parametros, enTitulo]
    ),
    consultar(`SELECT COUNT(*) AS total FROM proyectos p WHERE ${donde}`, parametros),
  ]);
  return { proyectos, total: Number(total) };
}

// En LIKE, "%" y "_" son comodines: si el usuario los escribe, se buscan tal cual
function escaparLike(texto) {
  return texto.replace(/[!%_]/g, '!$&');
}

// Años que tienen proyectos publicados (para el filtro), del más nuevo al más viejo
async function listarAnios() {
  const filas = await consultar(
    `SELECT DISTINCT anio FROM proyectos WHERE estado_revision = 'aprobado' ORDER BY anio DESC`
  );
  return filas.map((f) => f.anio);
}

// Un proyecto publicado con sus integrantes, tecnologías y ZIP. Devuelve null si no existe.
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
  const [integrantes, tecnologias, zip] = await Promise.all([
    consultar('SELECT nombre FROM proyecto_integrantes WHERE proyecto_id = ? ORDER BY id', [id]),
    consultar(
      `SELECT t.nombre FROM tecnologias t
         JOIN proyecto_tecnologias pt ON pt.tecnologia_id = t.id
        WHERE pt.proyecto_id = ? ORDER BY t.nombre`,
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
    `SELECT z.nombre_original, z.ruta, z.tamanio, z.arbol_json, z.subido
       FROM archivos_zip z
       JOIN proyectos p ON p.id = z.proyecto_id
      WHERE z.proyecto_id = ? AND p.estado_revision = 'aprobado'`,
    [proyectoId]
  );
  if (filas.length === 0) return null;
  const zip = filas[0];
  zip.arbol = JSON.parse(zip.arbol_json);
  delete zip.arbol_json;
  return zip;
}

async function listarTecnologias() {
  return consultar('SELECT id, nombre FROM tecnologias ORDER BY nombre');
}

// Guarda un proyecto nuevo con todo lo relacionado.
// Usa una transacción: o se guarda todo, o no se guarda nada.
async function crear({ datos, creadorId, propietariosIds, zip }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Por ahora se publica al instante ('aprobado'). Cuando exista el panel de
    // docentes se puede guardar como 'pendiente' para que lo revisen antes.
    const [resultado] = await conexion.execute(
      `INSERT INTO proyectos
         (titulo, descripcion_corta, descripcion, curso, division, anio, turno, materia, estado, estado_revision, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprobado', ?)`,
      [datos.titulo, datos.descripcion_corta, datos.descripcion, datos.curso, datos.division,
        datos.anio, datos.turno, datos.materia, datos.estado, creadorId]
    );
    const id = resultado.insertId;

    for (const usuarioId of new Set([creadorId, ...propietariosIds])) {
      await conexion.execute('INSERT INTO proyecto_propietarios (proyecto_id, usuario_id) VALUES (?, ?)', [id, usuarioId]);
    }
    for (const nombre of datos.integrantes) {
      await conexion.execute('INSERT INTO proyecto_integrantes (proyecto_id, nombre) VALUES (?, ?)', [id, nombre]);
    }
    for (const tecnologiaId of datos.tecnologias) {
      await conexion.execute('INSERT INTO proyecto_tecnologias (proyecto_id, tecnologia_id) VALUES (?, ?)', [id, tecnologiaId]);
    }
    await conexion.execute(
      `INSERT INTO archivos_zip (proyecto_id, nombre_original, ruta, tamanio, arbol_json, subido_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, zip.nombreOriginal, zip.ruta, zip.tamanio, JSON.stringify(zip.arbol), creadorId]
    );

    await conexion.commit();
    return id;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

module.exports = {
  listarRecientes,
  listarDestacados,
  buscar,
  listarAnios,
  obtenerDetalle,
  obtenerZip,
  listarTecnologias,
  crear,
};
