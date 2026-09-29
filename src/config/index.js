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
  emailDominio: process.env.EMAIL_DOMINIO || 'ejemplo.edu.ar',
  zipMaxMb: Number(process.env.ZIP_MAX_MB) || 250,
};

module.exports = config;
