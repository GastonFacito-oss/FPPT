// Lee la configuración del archivo .env y la deja en un solo objeto.
// Así el resto del código nunca usa process.env directamente.
require('dotenv').config({ quiet: true });

const config = {
  puerto: Number(process.env.PUERTO) || 3000,
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
  sesionSecreto: process.env.SESION_SECRETO || 'cambiar-esta-clave-en-el-servidor',
  produccion: process.env.NODE_ENV === 'production',
  zipMaxMb: Number(process.env.ZIP_MAX_MB) || 250,
};

module.exports = config;
