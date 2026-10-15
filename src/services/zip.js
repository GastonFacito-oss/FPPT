// Lee la lista de archivos de un ZIP SIN descomprimirlo ni ejecutar nada,
// la valida y la convierte en un árbol de carpetas para mostrar en el sitio.
const yauzl = require('yauzl');

// Extensiones que no se aceptan dentro de un proyecto (programas que se ejecutan solos).
// La misma lista está en public/js/subir.js para avisar antes de subir.
const EXTENSIONES_PROHIBIDAS = ['exe', 'bat', 'cmd', 'msi', 'vbs', 'ps1', 'scr', 'com'];
const MAX_ENTRADAS = 20000;

// Error con un mensaje pensado para mostrarle al usuario
class ErrorZip extends Error {}

async function analizarZip(ruta) {
  let zip;
  try {
    zip = await yauzl.openPromise(ruta, { lazyEntries: true });
  } catch {
    throw new ErrorZip('El archivo no es un ZIP válido. Probá comprimir la carpeta de nuevo.');
  }

  const entradas = [];
  try {
    for await (const entrada of zip.eachEntry()) {
      // yauzl ya rechaza rutas peligrosas como "../" o "C:/" (lanza un error)
      const ruta = entrada.fileName;
      if (ignorar(ruta)) continue;
      entradas.push({ ruta, tamanio: entrada.uncompressedSize, esCarpeta: ruta.endsWith('/') });
      if (entradas.length > MAX_ENTRADAS) {
        throw new ErrorZip(`El ZIP tiene demasiados archivos (máximo ${MAX_ENTRADAS}).`);
      }
    }
  } catch (err) {
    if (err instanceof ErrorZip) throw err;
    throw new ErrorZip('El ZIP está dañado o tiene nombres de archivo no válidos.');
  } finally {
    zip.close();
  }

  const archivos = entradas.filter((e) => !e.esCarpeta);
  if (archivos.length === 0) throw new ErrorZip('El ZIP está vacío.');

  const prohibidos = archivos.filter((e) => EXTENSIONES_PROHIBIDAS.includes(extension(e.ruta)));
  if (prohibidos.length > 0) {
    const ejemplos = prohibidos.slice(0, 3).map((e) => e.ruta).join(', ');
    throw new ErrorZip(`El ZIP tiene archivos no permitidos: ${ejemplos}${prohibidos.length > 3 ? '…' : ''}. Sacalos y volvé a comprimir.`);
  }

  return { arbol: armarArbol(entradas), cantidad: archivos.length };
}

// Archivos basura que agregan algunos sistemas al comprimir
function ignorar(ruta) {
  return ruta.startsWith('__MACOSX/') || /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(ruta);
}

function extension(ruta) {
  const partes = ruta.split('/').pop().split('.');
  return partes.length > 1 ? partes.pop().toLowerCase() : '';
}

// Convierte ["src/app.js", "README.md"] en un árbol:
//   carpeta: { nombre, hijos: [...] }    archivo: { nombre, tamanio }
function armarArbol(entradas) {
  const raiz = { hijos: new Map() };
  for (const entrada of entradas) {
    const partes = entrada.ruta.split('/').filter(Boolean);
    let actual = raiz;
    partes.forEach((parte, i) => {
      const esArchivo = i === partes.length - 1 && !entrada.esCarpeta;
      if (esArchivo) {
        actual.hijos.set(parte, { nombre: parte, tamanio: entrada.tamanio });
      } else {
        if (!actual.hijos.has(parte) || !actual.hijos.get(parte).hijos) {
          actual.hijos.set(parte, { nombre: parte, hijos: new Map() });
        }
        actual = actual.hijos.get(parte);
      }
    });
  }
  return aLista(raiz.hijos);
}

function aLista(hijos) {
  return [...hijos.values()].map((nodo) =>
    nodo.hijos ? { nombre: nodo.nombre, hijos: aLista(nodo.hijos) } : nodo
  );
}

function contarArchivos(nodos) {
  return nodos.reduce((total, nodo) => total + (nodo.hijos ? contarArchivos(nodo.hijos) : 1), 0);
}

module.exports = { analizarZip, contarArchivos, ErrorZip, EXTENSIONES_PROHIBIDAS };
