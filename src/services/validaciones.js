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

module.exports = { limpiarRegistro, validarRegistro };
