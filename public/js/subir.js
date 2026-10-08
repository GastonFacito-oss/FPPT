// Pantalla "Subir proyecto".
// - Antes de subir, lee la lista de archivos del ZIP en el navegador y la muestra como árbol.
// - Revisa el tamaño y que no tenga archivos peligrosos (el servidor lo vuelve a revisar).
// - Sube el formulario con una barra de progreso real y, al terminar, vuelve al inicio,
//   donde el proyecto nuevo aparece primero.
// Si el navegador no tiene JavaScript, el formulario se envía igual de la forma común.
(function () {
  'use strict';

  var MAX_MB = window.FPPT_ZIP_MAX_MB || 250;
  // Misma lista que src/services/zip.js
  var PROHIBIDAS = ['exe', 'bat', 'cmd', 'msi', 'vbs', 'ps1', 'scr', 'com'];

  var form = document.getElementById('form-subir');
  if (!form) return;

  var inputZip = document.getElementById('zip');
  var zona = document.getElementById('zona-zip');
  var errorZip = document.getElementById('zip-error');
  var vistaZip = document.getElementById('vista-zip');
  var resultado = document.getElementById('resultado');
  var botonGuardar = document.getElementById('boton-guardar');
  var zipValido = null; // { nombre, tamanio }
  var subiendo = false;

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
          return e.ruta.indexOf('__MACOSX/') !== 0 && !/(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(e.ruta);
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
        if (entradas.some(function (e) { return /(^|\/)\.\.(\/|$)/.test(e.ruta) || e.ruta.charAt(0) === '/'; })) {
          return mostrarErrorZip('El ZIP tiene rutas no válidas.');
        }

        mostrarZip(archivo, archivos.length + ' archivos', armarArbol(entradas));
      })
      .catch(function (err) {
        if (err && err.message === 'zip64') {
          // ZIP muy grande para leerlo acá: se puede subir igual, el servidor lo revisa
          return mostrarZip(archivo, 'Vista previa no disponible para este ZIP', null);
        }
        mostrarErrorZip('No se pudo leer el ZIP. ¿Está dañado? Probá comprimirlo de nuevo.');
      });
  }

  function mostrarZip(archivo, detalle, arbol) {
    zipValido = { nombre: archivo.name, tamanio: archivo.size };
    document.getElementById('zip-nombre').textContent = archivo.name;
    document.getElementById('zip-meta').textContent = formatearTamanio(archivo.size) + ' · ' + detalle;
    var contenedor = document.getElementById('zip-arbol');
    contenedor.innerHTML = '';
    contenedor.classList.toggle('oculto', !arbol);
    document.getElementById('zip-vista-texto').classList.toggle('oculto', !arbol);
    if (arbol) contenedor.appendChild(crearArbol(arbol, 0));
    vistaZip.classList.remove('oculto');
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

  // ---------- Guardar: subir el formulario ----------
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (subiendo) return;
    ocultarResultado();
    borrarErroresDelServidor();

    var primerError = validarFormulario();
    if (primerError) {
      mostrarResultado('Revisá los datos marcados en rojo.');
      primerError.focus();
      return;
    }
    subirFormulario();
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

  function subirFormulario() {
    var caja = document.getElementById('progreso-subida');
    var barra = document.getElementById('progreso-barra');
    var relleno = barra.querySelector('.progreso__barra');
    var porcentaje = document.getElementById('progreso-porcentaje');
    var etiqueta = document.getElementById('progreso-etiqueta');

    function actualizar(valor, texto) {
      relleno.style.width = valor + '%';
      barra.setAttribute('aria-valuenow', Math.round(valor));
      porcentaje.textContent = Math.round(valor) + '%';
      if (texto) etiqueta.textContent = texto;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.responseType = 'json';
    xhr.setRequestHeader('X-Requested-With', 'fetch'); // el servidor responde en JSON
    xhr.setRequestHeader('X-CSRF-Token', form.elements._csrf.value);

    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) actualizar((e.loaded / e.total) * 100);
    });
    xhr.upload.addEventListener('load', function () {
      actualizar(100, 'Revisando el ZIP…');
    });

    xhr.addEventListener('load', function () {
      var respuesta = xhr.response || {};
      if (xhr.status === 200 && respuesta.ok) {
        etiqueta.textContent = '¡Listo! Abriendo el inicio…';
        subiendo = false;
        window.location.href = respuesta.url; // el inicio, con el proyecto nuevo primero
        return;
      }
      terminar();
      if (respuesta.errores) {
        mostrarErroresDelServidor(respuesta.errores);
        mostrarResultado('Revisá los datos marcados en rojo.');
      } else {
        mostrarResultado(respuesta.mensaje || 'No se pudo guardar el proyecto. Probá de nuevo en unos minutos.');
      }
    });

    xhr.addEventListener('error', function () {
      terminar();
      mostrarResultado('Se cortó la conexión mientras se subía el archivo. Revisá internet y probá de nuevo.');
    });

    subiendo = true;
    botonGuardar.disabled = true;
    caja.classList.remove('oculto');
    actualizar(0, 'Subiendo ' + zipValido.nombre + '…');
    xhr.send(new FormData(form));

    function terminar() {
      subiendo = false;
      botonGuardar.disabled = false;
      caja.classList.add('oculto');
    }
  }

  // Avisa antes de cerrar la página si hay una subida en curso
  window.addEventListener('beforeunload', function (e) {
    if (subiendo) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---------- Mensajes ----------
  function mostrarResultado(texto) {
    resultado.textContent = texto;
    resultado.classList.remove('oculto');
    resultado.focus();
    resultado.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function ocultarResultado() {
    resultado.classList.add('oculto');
  }

  // Errores que devuelve el servidor: { campo: 'mensaje' }
  function mostrarErroresDelServidor(errores) {
    Object.keys(errores).forEach(function (campo) {
      if (campo === 'zip') return mostrarErrorZip(errores.zip);
      var input = document.getElementById(campo);
      if (!input) return;
      var contenedor = input.closest('.campo');
      contenedor.classList.add('campo--error');
      input.setAttribute('aria-invalid', 'true');
      var descripciones = (input.getAttribute('aria-describedby') || '').split(' ');
      if (descripciones.indexOf(campo + '-error') === -1) {
        input.setAttribute('aria-describedby', descripciones.concat(campo + '-error').join(' ').trim());
      }
      var mensaje = document.createElement('small');
      mensaje.className = 'campo__error';
      mensaje.id = campo + '-error';
      mensaje.setAttribute('data-error-servidor', '');
      mensaje.textContent = errores[campo];
      contenedor.appendChild(mensaje);
    });
  }

  function borrarErroresDelServidor() {
    form.querySelectorAll('[data-error-servidor], .campo > .campo__error:not(#zip-error)').forEach(function (el) {
      el.remove();
    });
    form.querySelectorAll('.campo--error:not(#campo-zip)').forEach(function (el) {
      el.classList.remove('campo--error');
    });
    form.querySelectorAll('[aria-invalid]:not(#zip)').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
  }
})();
