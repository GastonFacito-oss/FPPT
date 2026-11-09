// Lee la configuración del archivo .env y la deja en un solo objeto.
// Así el resto del código nunca usa process.env directamente.
const path = require('path');
require('dotenv').config({ quiet: true });

const SECRETO_DE_EJEMPLO = 'cambiar-esta-clave-en-el-servidor';

const config = {
  puerto: Number(process.env.PUERTO) || 3000,
  // Desde dónde se aceptan visitas. 127.0.0.1 = solo desde esta computadora (lo que se usa
  // detrás del servidor HTTPS de la escuela). Vacío = desde toda la red.
  host: process.env.HOST || '',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PUERTO) || 3306,
    user: process.env.DB_USUARIO || 'root',
    password: process.env.DB_CLAVE || '',
    database: process.env.DB_NOMBRE || 'fppt',
  },
  // Lista de dominios permitidos para registrarse. Vacía = se acepta cualquiera.
  emailDominios: (process.env.EMAIL_DOMINIO || '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean),
  sesionSecreto: process.env.SESION_SECRETO || SECRETO_DE_EJEMPLO,
  // NODE_ENV=production en el servidor de la escuela: sin datos ni ayudas de prueba
  produccion: process.env.NODE_ENV === 'production',
  // Cuántos servidores intermedios (el que pone el HTTPS) hay delante del sitio.
  // 0 = ninguno (el sitio recibe las visitas directo). Ver docs/instalacion-servidor.md
  proxyConfiable: Number(process.env.PROXY_CONFIABLE) || 0,
  zipMaxMb: Number(process.env.ZIP_MAX_MB) || 250,
  // Carpeta donde se guardan los ZIP subidos (fuera de "public": no se pueden abrir directo)
  carpetaZips: path.join(__dirname, '..', '..', 'storage', 'zips'),
};

// Revisa que la configuración sea segura para publicar el sitio en internet.
// Devuelve { errores, avisos }: con errores, el sitio no arranca en producción.
function revisarConfiguracion() {
  const errores = [];
  const avisos = [];
  if (!config.produccion) return { errores, avisos };

  if (config.sesionSecreto === SECRETO_DE_EJEMPLO || config.sesionSecreto.length < 32) {
    errores.push('SESION_SECRETO tiene que ser una clave propia de al menos 32 caracteres (ver "npm run generar-secreto").');
  }
  if (!config.db.password) {
    errores.push('DB_CLAVE está vacía: en el servidor, MySQL tiene que tener un usuario con contraseña.');
  }
  if (config.db.user === 'root') {
    avisos.push('Se usa el usuario "root" de MySQL. Conviene crear un usuario solo para FPPT (ver docs/instalacion-servidor.md).');
  }
  if (config.emailDominios.length === 0) {
    avisos.push('EMAIL_DOMINIO está vacío: cualquiera puede crear una cuenta con cualquier email.');
  }
  if (config.proxyConfiable > 0 && config.host !== '127.0.0.1') {
    avisos.push('Con un servidor HTTPS delante, poné HOST=127.0.0.1 para que nadie entre directo al puerto ' + config.puerto + '.');
  }
  if (config.proxyConfiable === 0) {
    avisos.push('PROXY_CONFIABLE=0: si el sitio está detrás del servidor HTTPS de la escuela, poné PROXY_CONFIABLE=1.');
  }
  return { errores, avisos };
}

config.revisarConfiguracion = revisarConfiguracion;
module.exports = config;
