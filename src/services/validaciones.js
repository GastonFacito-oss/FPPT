// Reglas para validar los datos que llegan de los formularios.
// Devuelven un objeto { campo: 'mensaje de error' }. Si está vacío, está todo bien.
const config = require('../config');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limpiarRegistro(body) {
  return {
    nombre: String(body.nombre || '').trim().replace(/\s+/g, ' '),
    email: String(body.email || '').trim().toLowerCase(),
    dni: String(body.dni || '').trim().replace(/\./g, ''),
    password: String(body.password || ''),
    password2: String(body.password2 || ''),
  };
}

function validarRegistro(datos) {
  const errores = {};

  if (datos.nombre.length < 5 || !datos.nombre.includes(' ')) {
    errores.nombre = 'Escribí tu nombre y apellido.';
  } else if (datos.nombre.length > 120 || !/^[\p{L} '-]+$/u.test(datos.nombre)) {
    errores.nombre = 'El nombre solo puede tener letras y espacios.';
  }

  if (!EMAIL.test(datos.email) || datos.email.length > 160) {
    errores.email = 'Escribí un email válido.';
  } else if (!emailPermitido(datos.email)) {
    errores.email = `Usá tu Gmail escolar (@${config.emailDominios.join(' o @')}).`;
  }

  if (!/^\d{7,8}$/.test(datos.dni)) {
    errores.dni = 'El DNI tiene que tener 7 u 8 números, sin puntos.';
  }

  if (datos.password.length < 8 || !/[A-Za-z]/.test(datos.password) || !/\d/.test(datos.password)) {
    errores.password = 'La contraseña necesita al menos 8 caracteres, con letras y números.';
  } else if (datos.password.length > 72) {
    errores.password = 'La contraseña puede tener hasta 72 caracteres.';
  }

  if (datos.password2 !== datos.password) {
    errores.password2 = 'Las contraseñas no coinciden.';
  }

  return errores;
}

// Si no se configuró un dominio, se acepta cualquier email (modo prueba)
function emailPermitido(email) {
  if (config.emailDominios.length === 0) return true;
  const dominio = email.split('@')[1];
  return config.emailDominios.includes(dominio);
}

// ---------- Proyectos ----------

const MATERIAS = ['Proyecto 1', 'Proyecto 2', 'Proyecto 3'];
const TURNOS = ['Mañana', 'Tarde', 'Vespertino'];
const ESTADOS = ['terminado', 'en_curso', 'abandonado'];

// Si un campo llega repetido, se usa el primer valor
const texto = (valor) => String((Array.isArray(valor) ? valor[0] : valor) || '').trim();
const lista = (valor) => [].concat(valor || []); // un valor suelto o varios -> siempre un array

function limpiarProyecto(body) {
  return {
    titulo: texto(body.titulo).replace(/\s+/g, ' '),
    descripcion_corta: texto(body.descripcion_corta).replace(/\s+/g, ' '),
    descripcion: texto(body.descripcion).replace(/\r\n/g, '\n'),
    materia: texto(body.materia),
    curso: Number(texto(body.curso)),
    division: texto(body.division),
    anio: Number(texto(body.anio)),
    turno: texto(body.turno),
    estado: texto(body.estado),
    // Un integrante por línea, sin líneas vacías ni repetidos
    integrantes: [...new Set(texto(body.integrantes).split(/\r?\n/).map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean))],
    // Emails separados por coma, punto y coma o espacios
    propietarios: [...new Set(texto(body.propietarios).toLowerCase().split(/[\s,;]+/).filter(Boolean))],
    tecnologias: [...new Set(lista(body.tecnologias).map(Number).filter((id) => Number.isInteger(id) && id > 0))],
  };
}

function validarProyecto(datos) {
  const errores = {};
  const anioActual = new Date().getFullYear();

  if (datos.titulo.length < 3 || datos.titulo.length > 150) {
    errores.titulo = 'El nombre tiene que tener entre 3 y 150 caracteres.';
  }
  if (datos.descripcion_corta.length < 10 || datos.descripcion_corta.length > 200) {
    errores.descripcion_corta = 'La descripción corta tiene que tener entre 10 y 200 caracteres.';
  }
  if (datos.descripcion.length < 20 || datos.descripcion.length > 5000) {
    errores.descripcion = 'Contá un poco más del proyecto (entre 20 y 5000 caracteres).';
  }
  if (!MATERIAS.includes(datos.materia)) errores.materia = 'Elegí la materia.';
  if (!Number.isInteger(datos.curso) || datos.curso < 1 || datos.curso > 7) errores.curso = 'Elegí el curso.';
  if (!/^[\p{L}\d°º ]{1,10}$/u.test(datos.division)) errores.division = 'Escribí la división (por ejemplo: 2da).';
  if (!Number.isInteger(datos.anio) || datos.anio < 2000 || datos.anio > anioActual) {
    errores.anio = `El año tiene que estar entre 2000 y ${anioActual}.`;
  }
  if (!TURNOS.includes(datos.turno)) errores.turno = 'Elegí el turno.';
  if (!ESTADOS.includes(datos.estado)) errores.estado = 'Elegí el estado.';

  if (datos.integrantes.length === 0) {
    errores.integrantes = 'Escribí al menos un integrante.';
  } else if (datos.integrantes.length > 15 || datos.integrantes.some((n) => n.length > 120)) {
    errores.integrantes = 'Hasta 15 integrantes, con nombres de hasta 120 caracteres.';
  }

  if (datos.propietarios.length > 10) {
    errores.propietarios = 'Podés agregar hasta 10 compañeros.';
  } else if (datos.propietarios.some((email) => !EMAIL.test(email))) {
    errores.propietarios = 'Revisá los emails: hay uno que no es válido.';
  }

  return errores;
}

module.exports = { limpiarRegistro, validarRegistro, limpiarProyecto, validarProyecto, MATERIAS, TURNOS, ESTADOS };
