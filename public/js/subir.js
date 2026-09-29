// Pantalla "Subir proyecto" (VERSIÓN DE DEMOSTRACIÓN).
// - Lee la lista de archivos del ZIP elegido directamente en el navegador (no lo sube)
//   y la muestra como árbol de carpetas.
// - Revisa el tamaño y que no tenga archivos peligrosos.
// - Al guardar, simula la barra de progreso. No se envía nada al servidor.
(function () {
  'use strict';

  var MAX_MB = window.FPPT_ZIP_MAX_MB || 250;
  var PROHIBIDAS = ['exe', 'bat', 'cmd', 'msi', 'vbs', 'ps1', 'scr', 'com'];

  var form = document.getElementById('form-subir');
  if (!form) return;

  var inputZip = document.getElementById('zip');
  var zona = document.getElementById('zona-zip');
  var errorZip = document.getElementById('zip-error');
  var vistaZip = document.getElementById('vista-zip');
  var resultado = document.getElementById('resultado');
  var botonGuardar = document.getElementById('boton-guardar');
  var zipValido = null; // { nombre, tamanio, cantidad }

  // ---------- Contador de la descripción corta ----------
  var corta = document.getElementById('descripcion_corta');
  var contador = document.querySelector('[data-contador]');
  corta.addEventListener('input', function () {
    contador.textContent = corta.value.length;
  });

  // ---------- Elegir o arrastrar el ZIP ----------
  ['dragenter', 'dragover'].forEach(function (evento) {
    zona.addEventListener(evento, function () { zona.classList.add('zona-zip--activa'); });
  });
  ['dragleave', 'drop'].forEach(function (evento) {
    zona.addEventListener(evento, function () { zona.classList.remove('zona-zip--activa'); });
  });

  inputZip.addEventListener('change', function () {
    var archivo = inputZip.files[0];
    limpiarZip(false);
    if (archivo) revisarZip(archivo);
  });

  document.getElementById('zip-quitar').addEventListener('click', function () {
    limpiarZip(true);
    inputZip.focus();
  });

  function revisarZip(archivo) {
    if (!/\.zip$/i.test(archivo.name)) {
      return mostrarErrorZip('El archivo tiene que ser un .zip.');
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      return mostrarErrorZip('El ZIP pesa ' + formatearTamanio(archivo.size) + '. El máximo es ' + MAX_MB + ' MB.');
    }

    leerListaZip(archivo)
      .then(function (entradas) {
        entradas = entradas.filter(function (e) {
          return e.ruta.indexOf('__MACOSX/') !== 0 && !/(^|\/)\.DS_Store$/.test(e.ruta);
        });
        var archivos = entradas.filter(function (e) { return !e.esCarpeta; });

        if (archivos.length === 0) return mostrarErrorZip('El ZIP está vacío.');

        var peligrosos = archivos.filter(function (e) {
          return PROHIBIDAS.indexOf(extension(e.ruta)) !== -1;
        });
        if (peligrosos.length) {
          return mostrarErrorZip('El ZIP tiene archivos no permitidos: ' +
            peligrosos.slice(0, 3).map(function (e) { return e.ruta; }).join(', ') +
            (peligrosos.length > 3 ? '…' : '') + '. Sacalos y volvé a comprimir.');
        }
        if (entradas.some(function (e) { return e.ruta.indexOf('..') !== -1 || e.ruta.charAt(0) === '/'; })) {
          return mostrarErrorZip('El ZIP tiene rutas no válidas.');
        }

        zipValido = { nombre: archivo.name, tamanio: archivo.size, cantidad: archivos.length };
        document.getElementById('zip-nombre').textContent = archivo.name;
        document.getElementById('zip-meta').textContent =
          formatearTamanio(archivo.size) + ' · ' + archivos.length + ' archivos';
        var contenedor = document.getElementById('zip-arbol');
        contenedor.innerHTML = '';
        contenedor.appendChild(crearArbol(armarArbol(entradas), 0));
        vistaZip.classList.remove('oculto');
      })
      .catch(function (err) {
        mostrarErrorZip(err && err.message === 'zip64'
          ? 'Este ZIP es demasiado grande para la vista previa, pero se va a poder subir.'
          : 'No se pudo leer el ZIP. ¿Está dañado? Probá comprimirlo de nuevo.');
      });
  }

  function mostrarErrorZip(texto) {
    zipValido = null;
    errorZip.textContent = texto;
    errorZip.classList.remove('oculto');
    document.getElementById('campo-zip').classList.add('campo--error');
    inputZip.setAttribute('aria-invalid', 'true');
  }

  function limpiarZip(borrarArchivo) {
    zipValido = null;
    if (borrarArchivo) inputZip.value = '';
    errorZip.textContent = '';
    errorZip.classList.add('oculto');
    document.getElementById('campo-zip').classList.remove('campo--error');
    inputZip.removeAttribute('aria-invalid');
    vistaZip.classList.add('oculto');
  }

  // ---------- Leer la lista de archivos de un ZIP ----------
  // Un ZIP guarda al final un "directorio central" con el nombre y tamaño de cada archivo.
  // Leemos solo esa parte, así funciona rápido aunque el ZIP pese mucho.
  function leerListaZip(archivo) {
    var colaTamanio = Math.min(archivo.size, 65557); // 22 bytes + comentario máximo
    return leerBytes(archivo, archivo.size - colaTamanio, archivo.size).then(function (cola) {
      var fin = -1;
      for (var i = cola.byteLength - 22; i >= 0; i--) {
        if (cola.getUint32(i, true) === 0x06054b50) { fin = i; break; }
      }
      if (fin === -1) throw new Error('no-es-zip');

      var cantidad = cola.getUint16(fin + 10, true);
      var dirTamanio = cola.getUint32(fin + 12, true);
      var dirInicio = cola.getUint32(fin + 16, true);
      if (cantidad === 0xffff || dirInicio === 0xffffffff) throw new Error('zip64');

      return leerBytes(archivo, dirInicio, dirInicio + dirTamanio).then(function (dir) {
        var entradas = [];
        var utf8 = new TextDecoder('utf-8');
        var p = 0;
        for (var n = 0; n < cantidad; n++) {
          if (dir.getUint32(p, true) !== 0x02014b50) throw new Error('dañado');
          var tamanio = dir.getUint32(p + 24, true);
          var largoNombre = dir.getUint16(p + 28, true);
          var largoExtra = dir.getUint16(p + 30, true);
          var largoComentario = dir.getUint16(p + 32, true);
          var bytesNombre = new Uint8Array(dir.buffer, dir.byteOffset + p + 46, largoNombre);
          var ruta = utf8.decode(bytesNombre).replace(/\\/g, '/');
          entradas.push({ ruta: ruta, tamanio: tamanio, esCarpeta: ruta.slice(-1) === '/' });
          p += 46 + largoNombre + largoExtra + largoComentario;
        }
        return entradas;
      });
    });
  }

  function leerBytes(archivo, desde, hasta) {
    return archivo.slice(desde, hasta).arrayBuffer().then(function (buffer) {
      return new DataView(buffer);
    });
  }

  // Convierte la lista de rutas ("src/app.js") en un árbol de carpetas
  function armarArbol(entradas) {
    var raiz = { hijos: {} };
    entradas.forEach(function (entrada) {
      var partes = entrada.ruta.split('/').filter(Boolean);
      var actual = raiz;
      partes.forEach(function (parte, i) {
        var esUltima = i === partes.length - 1;
        if (esUltima && !entrada.esCarpeta) {
          actual.hijos[parte] = { nombre: parte, tamanio: entrada.tamanio };
        } else {
          if (!actual.hijos[parte] || !actual.hijos[parte].hijos) {
            actual.hijos[parte] = { nombre: parte, hijos: {} };
          }
          actual = actual.hijos[parte];
        }
      });
    });
    return aLista(raiz.hijos);
  }

  function aLista(hijos) {
    return Object.keys(hijos).map(function (clave) {
      var nodo = hijos[clave];
      return nodo.hijos ? { nombre: nodo.nombre, hijos: aLista(nodo.hijos) } : nodo;
    });
  }

  // Crea el HTML del árbol (mismas clases que src/views/partials/arbol.ejs)
  function crearArbol(nodos, nivel) {
    var ul = document.createElement('ul');
    ul.className = 'arbol' + (nivel === 0 ? ' arbol--raiz' : '');
    nodos.slice().sort(function (a, b) {
      if (!!a.hijos !== !!b.hijos) return a.hijos ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, 'es');
    }).forEach(function (nodo) {
      var li = document.createElement('li');
      li.className = 'arbol__item';
      if (nodo.hijos) {
        var details = document.createElement('details');
        if (nivel < 1) details.open = true;
        var summary = document.createElement('summary');
        summary.className = 'arbol__carpeta';
        summary.appendChild(span('arbol__nombre', nodo.nombre + '/'));
        details.appendChild(summary);
        details.appendChild(crearArbol(nodo.hijos, nivel + 1));
        li.appendChild(details);
      } else {
        li.className += ' arbol__archivo';
        li.appendChild(span('arbol__nombre', nodo.nombre));
        li.appendChild(span('arbol__ext', extension(nodo.nombre)));
        li.appendChild(span('arbol__tamanio', formatearTamanio(nodo.tamanio)));
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function span(clase, texto) {
    var el = document.createElement('span');
    el.className = clase;
    el.textContent = texto; // textContent: los nombres de archivo nunca se interpretan como HTML
    return el;
  }

  function extension(nombre) {
    var partes = nombre.split('/').pop().split('.');
    return partes.length > 1 ? partes.pop().toLowerCase() : '';
  }

  function formatearTamanio(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1).replace('.', ',') + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  // ---------- Guardar (simulado) ----------
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    resultado.classList.add('oculto');

    var primerError = validarFormulario();
    if (primerError) {
      primerError.focus();
      return;
    }
    simularSubida();
  });

  function validarFormulario() {
    var primerError = null;
    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (campo) {
      var contenedor = campo.closest('.campo');
      var vacio = !String(campo.value).trim();
      contenedor.classList.toggle('campo--error', vacio);
      if (vacio) {
        campo.setAttribute('aria-invalid', 'true');
        if (!primerError) primerError = campo;
      } else {
        campo.removeAttribute('aria-invalid');
      }
    });
    if (!zipValido) {
      if (!errorZip.textContent) mostrarErrorZip('Elegí el ZIP de tu proyecto.');
      if (!primerError) primerError = inputZip;
    }
    return primerError;
  }

  function simularSubida() {
    var caja = document.getElementById('progreso-subida');
    var barra = document.getElementById('progreso-barra');
    var relleno = barra.querySelector('.progreso__barra');
    var porcentaje = document.getElementById('progreso-porcentaje');
    var etiqueta = document.getElementById('progreso-etiqueta');
    var avance = 0;

    caja.classList.remove('oculto');
    etiqueta.textContent = 'Subiendo ' + zipValido.nombre + '…';
    botonGuardar.disabled = true;

    var intervalo = setInterval(function () {
      avance = Math.min(100, avance + 4 + Math.random() * 8);
      relleno.style.width = avance + '%';
      barra.setAttribute('aria-valuenow', Math.round(avance));
      porcentaje.textContent = Math.round(avance) + '%';

      if (avance >= 100) {
        clearInterval(intervalo);
        etiqueta.textContent = 'Listo';
        botonGuardar.disabled = false;
        resultado.innerHTML = '';
        resultado.appendChild(document.createTextNode('¡Simulación completa! En la versión final, “'));
        var nombre = document.createElement('strong');
        nombre.textContent = document.getElementById('titulo').value.trim();
        resultado.appendChild(nombre);
        resultado.appendChild(document.createTextNode('” quedaría guardado y pendiente de revisión docente. (No se guardó nada.)'));
        resultado.classList.remove('oculto');
        resultado.focus();
        resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }
})();
