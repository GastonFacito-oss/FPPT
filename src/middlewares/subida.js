// Recibe el ZIP del formulario "Subir proyecto" y lo guarda en storage/zips
// con un nombre al azar (nunca con el nombre que eligió el usuario).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');
const { tokenValido, rechazarFormulario } = require('./sesion');

fs.mkdirSync(config.carpetaZips, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: config.carpetaZips,
  filename: (req, archivo, listo) => listo(null, crypto.randomUUID() + '.zip'),
});

const subida = multer({
  storage: almacenamiento,
  limits: {
    fileSize: config.zipMaxMb * 1024 * 1024,
    files: 1,
    fields: 40,
    fieldSize: 20 * 1024, // 20 KB por campo de texto
  },
  fileFilter(req, archivo, listo) {
    // El token del formulario llega antes que el archivo: si no es válido,
    // se corta acá y el archivo ni siquiera se guarda.
    if (!tokenValido(req)) return listo(Object.assign(new Error('csrf'), { code: 'CSRF' }));
    if (path.extname(archivo.originalname).toLowerCase() !== '.zip') {
      req.errorSubida = 'El archivo tiene que ser un .zip.';
      return listo(null, false); // no se guarda
    }
    listo(null, true);
  },
}).single('zip');

// Envuelve a multer para convertir sus errores en mensajes para el formulario
function recibirZip(req, res, next) {
  subida(req, res, (err) => {
    if (!err) {
      // Si no vino ningún archivo, igual hay que revisar el token
      if (!req.file && !tokenValido(req)) return rechazarFormulario(req, res);
      return next();
    }
    if (err.code === 'CSRF') return rechazarFormulario(req, res);
    // El usuario canceló o se cortó la conexión: multer ya borró lo que se había guardado
    if (req.destroyed || err.message === 'Request aborted') return res.end();
    if (err instanceof multer.MulterError) {
      req.errorSubida =
        err.code === 'LIMIT_FILE_SIZE'
          ? `El ZIP supera los ${config.zipMaxMb} MB.`
          : 'No se pudo recibir el archivo. Subí un solo ZIP.';
      return next();
    }
    next(err);
  });
}

// Borra un ZIP que no se va a usar (por ejemplo, si el formulario tenía errores)
async function borrarArchivo(archivo) {
  if (!archivo) return;
  await fs.promises.unlink(archivo.path).catch(() => {});
}

module.exports = { recibirZip, borrarArchivo };
