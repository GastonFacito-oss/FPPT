// Inicio de sesión, registro y cierre de sesión.
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { limpiarRegistro, validarRegistro } = require('../services/validaciones');
const intentos = require('../services/intentosLogin');
const { avisar, nuevoToken } = require('../middlewares/sesion');
const config = require('../config');

// Hash de relleno: si el email no existe, igual comparamos contra algo
// para que la respuesta tarde lo mismo y no se pueda adivinar qué emails existen.
const HASH_FALSO = bcrypt.hashSync('contraseña-falsa-para-comparar', 10);

// Solo permite volver a páginas del propio sitio (evita redirecciones a otros sitios)
function destinoSeguro(volver) {
  const destino = String(volver || '');
  return destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';
}

// Guarda el usuario en la sesión, cambiando el id de sesión por seguridad
function iniciarSesion(req, usuario) {
  return new Promise((resolver, rechazar) => {
    req.session.regenerate((err) => {
      if (err) return rechazar(err);
      req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
      req.session.csrf = nuevoToken(); // lo usa el botón "Salir" y los formularios
      resolver();
    });
  });
}

function mostrarIngresar(req, res) {
  res.render('paginas/ingresar', {
    titulo: 'Ingresar',
    email: '',
    error: null,
    volver: destinoSeguro(req.query.volver),
  });
}

async function ingresar(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const volver = destinoSeguro(req.body.volver);
  const volverAMostrar = (error, codigo = 400) =>
    res.status(codigo).render('paginas/ingresar', { titulo: 'Ingresar', email, error, volver });

  if (!email || !password) return volverAMostrar('Completá tu email y tu contraseña.');

  if (intentos.estaBloqueado(req, email)) {
    return volverAMostrar('Hubo demasiados intentos. Esperá 15 minutos y probá de nuevo.', 429);
  }

  const usuario = await usuarioModel.buscarPorEmail(email);
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FALSO);

  if (!usuario || !coincide) {
    intentos.registrarFallo(req, email);
    return volverAMostrar('El email o la contraseña no son correctos.', 401);
  }
  if (!usuario.activo) {
    return volverAMostrar('Tu cuenta está bloqueada. Escribile al equipo FPPT.', 403);
  }

  intentos.limpiar(req, email);
  await iniciarSesion(req, usuario);
  avisar(req, 'exito', `¡Hola, ${usuario.nombre.split(' ')[0]}! Iniciaste sesión.`);
  res.redirect(volver);
}

function mostrarRegistro(req, res) {
  res.render('paginas/registro', {
    titulo: 'Crear cuenta',
    datos: { nombre: '', email: '', dni: '' },
    errores: {},
    dominios: config.emailDominios,
  });
}

async function registrar(req, res) {
  const datos = limpiarRegistro(req.body);
  const errores = validarRegistro(datos);

  if (!errores.email && !errores.dni) {
    const repetidos = await usuarioModel.datosRepetidos(datos.email, datos.dni);
    if (repetidos.email) errores.email = 'Ya existe una cuenta con este email. Probá ingresar.';
    if (repetidos.dni) errores.dni = 'Ya existe una cuenta con este DNI.';
  }

  const volverAMostrar = () =>
    res.status(400).render('paginas/registro', {
      titulo: 'Crear cuenta',
      datos: { nombre: datos.nombre, email: datos.email, dni: datos.dni }, // la contraseña nunca se devuelve
      errores,
      dominios: config.emailDominios,
    });

  if (Object.keys(errores).length > 0) return volverAMostrar();

  const passwordHash = await bcrypt.hash(datos.password, 10);
  let id;
  try {
    id = await usuarioModel.crear({ ...datos, passwordHash });
  } catch (err) {
    // Por si dos personas se registran con el mismo dato al mismo tiempo
    if (err.code === '23505') { // 23505 = dato repetido en PostgreSQL
      errores.email = 'Ese email o DNI ya está registrado.';
      return volverAMostrar();
    }
    throw err;
  }

  await iniciarSesion(req, { id, nombre: datos.nombre, email: datos.email, rol: 'estudiante' });
  avisar(req, 'exito', '¡Tu cuenta fue creada! Ya podés subir tu proyecto.');
  res.redirect('/');
}

function salir(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('fppt.sid');
    res.redirect('/');
  });
}

module.exports = { mostrarIngresar, ingresar, mostrarRegistro, registrar, salir };
