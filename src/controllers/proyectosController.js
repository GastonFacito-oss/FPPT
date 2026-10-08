// Proyectos: lista, detalle, subida y descarga.
const path = require('path');
const proyectoModel = require('../models/proyectoModel');
const usuarioModel = require('../models/usuarioModel');
const { obtenerDemo } = require('../data/demo-archivos');
const { limpiarProyecto, validarProyecto } = require('../services/validaciones');
const { analizarZip, contarArchivos, ErrorZip } = require('../services/zip');
const { borrarArchivo } = require('../middlewares/subida');
const { avisar, esPedidoJs } = require('../middlewares/sesion');
const config = require('../config');

const POR_PAGINA = 12;

// /proyectos: todos los proyectos publicados, los más nuevos primero
async function listar(req, res) {
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const { proyectos, total } = await proyectoModel.listarPagina(pagina, POR_PAGINA);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (pagina > paginas) return res.redirect(`/proyectos?pagina=${paginas}`);
  res.render('paginas/proyectos', { titulo: 'Proyectos', proyectos, total, pagina, paginas });
}

async function detalle(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(); // sigue hasta el 404

  const proyecto = await proyectoModel.obtenerDetalle(id);
  if (!proyecto) return next();

  let archivos = null;
  if (proyecto.zip) {
    // ZIP real, subido desde el sitio
    archivos = {
      real: true,
      nombreZip: proyecto.zip.nombre_original,
      tamanio: Number(proyecto.zip.tamanio),
      subido: proyecto.zip.subido,
      arbol: proyecto.zip.arbol,
      cantidad: contarArchivos(proyecto.zip.arbol),
    };
  } else {
    // Proyectos de ejemplo (ver src/data/demo-archivos.js)
    const demo = obtenerDemo(id);
    if (demo) archivos = { ...demo, real: false, cantidad: contarArchivos(demo.arbol) };
  }

  res.render('paginas/proyecto-detalle', { titulo: proyecto.titulo, proyecto, archivos });
}

// /proyectos/:id/descargar: entrega el ZIP con su nombre original
async function descargar(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next();

  const zip = await proyectoModel.obtenerZip(id);
  if (!zip) return next();

  // path.basename: aunque la base tuviera algo raro, nunca sale de la carpeta de ZIPs
  const ruta = path.join(config.carpetaZips, path.basename(zip.ruta));
  res.download(ruta, zip.nombre_original, (err) => {
    if (err && !res.headersSent) next(); // el archivo no está en el disco -> 404
  });
}

async function mostrarSubir(req, res) {
  const tecnologias = await proyectoModel.listarTecnologias();
  res.render('paginas/subir', {
    titulo: 'Subir proyecto',
    tecnologias,
    valores: { anio: new Date().getFullYear(), estado: 'en_curso' },
    errores: {},
    zipMaxMb: config.zipMaxMb,
  });
}

// Recibe el formulario con el ZIP (ver src/middlewares/subida.js)
async function subir(req, res) {
  const archivo = req.file;
  try {
    const datos = limpiarProyecto(req.body);
    const errores = validarProyecto(datos);

    // Solo tecnologías que existen en la base
    const tecnologias = await proyectoModel.listarTecnologias();
    const idsValidos = new Set(tecnologias.map((t) => t.id));
    datos.tecnologias = datos.tecnologias.filter((id) => idsValidos.has(id));

    // Los compañeros que se agregan como propietarios tienen que tener cuenta
    let propietariosIds = [];
    if (!errores.propietarios && datos.propietarios.length) {
      const encontrados = await usuarioModel.buscarPorEmails(datos.propietarios);
      const faltan = datos.propietarios.filter((email) => !encontrados.some((u) => u.email === email));
      if (faltan.length) errores.propietarios = `Estos emails no tienen cuenta en FPPT: ${faltan.join(', ')}.`;
      propietariosIds = encontrados.map((u) => u.id);
    }

    // El ZIP: que haya llegado y que su contenido sea válido
    let contenido = null;
    if (req.errorSubida) {
      errores.zip = req.errorSubida;
    } else if (!archivo) {
      errores.zip = 'Elegí el ZIP de tu proyecto.';
    } else {
      try {
        contenido = await analizarZip(archivo.path);
      } catch (err) {
        if (!(err instanceof ErrorZip)) throw err;
        errores.zip = err.message;
      }
    }

    if (Object.keys(errores).length > 0) {
      await borrarArchivo(archivo);
      return responderConErrores(req, res, errores, datos, tecnologias);
    }

    const id = await proyectoModel.crear({
      datos,
      creadorId: req.session.usuario.id,
      propietariosIds,
      zip: {
        nombreOriginal: nombreOriginalSeguro(archivo.originalname),
        ruta: archivo.filename,
        tamanio: archivo.size,
        arbol: contenido.arbol,
      },
    });

    avisar(req, 'exito', `¡Listo! “${datos.titulo}” ya está publicado y aparece primero en el inicio.`);
    // Vuelve al inicio, directo a la tarjeta del proyecto nuevo
    const destino = `/#proyecto-${id}`;
    if (esPedidoJs(req)) return res.json({ ok: true, url: destino, proyecto: `/proyectos/${id}` });
    res.redirect(destino);
  } catch (err) {
    await borrarArchivo(archivo);
    throw err;
  }
}

function responderConErrores(req, res, errores, datos, tecnologias) {
  if (esPedidoJs(req)) return res.status(400).json({ ok: false, errores });
  res.status(400).render('paginas/subir', {
    titulo: 'Subir proyecto',
    tecnologias,
    valores: {
      ...datos,
      integrantes: datos.integrantes.join('\n'),
      propietarios: datos.propietarios.join(', '),
    },
    errores,
    zipMaxMb: config.zipMaxMb,
  });
}

// El nombre con el que se descargará el ZIP: sin rutas ni caracteres raros
function nombreOriginalSeguro(nombre) {
  const base = path.basename(String(nombre || 'proyecto.zip')).replace(/[\u0000-\u001f"\\/<>:|?*]/g, '_').slice(0, 200);
  return base.toLowerCase().endsWith('.zip') ? base : base + '.zip';
}

module.exports = { listar, detalle, descargar, mostrarSubir, subir };
