// Frena a quien prueba muchas contraseñas seguidas.
// Después de 5 intentos fallidos con el mismo email (o desde la misma computadora),
// hay que esperar 15 minutos.
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const intentos = new Map(); // clave -> { cantidad, desde }

function claves(req, email) {
  return ['email:' + email, 'ip:' + req.ip];
}

function estaBloqueado(req, email) {
  return claves(req, email).some((clave) => {
    const registro = intentos.get(clave);
    if (!registro) return false;
    if (Date.now() - registro.desde > BLOQUEO_MS) {
      intentos.delete(clave);
      return false;
    }
    return registro.cantidad >= MAX_INTENTOS * (clave.startsWith('ip:') ? 4 : 1);
  });
}

function registrarFallo(req, email) {
  for (const clave of claves(req, email)) {
    const registro = intentos.get(clave);
    if (!registro || Date.now() - registro.desde > BLOQUEO_MS) {
      intentos.set(clave, { cantidad: 1, desde: Date.now() });
    } else {
      registro.cantidad += 1;
    }
  }
}

function limpiar(req, email) {
  intentos.delete('email:' + email);
}

module.exports = { estaBloqueado, registrarFallo, limpiar };
