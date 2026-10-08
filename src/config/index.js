// Lee la configuración del archivo .env y la deja en un solo objeto.
// Así el resto del código nunca usa process.env directamente.
const path = require('path');
require('dotenv').config({ quiet: true });

const config = {
  puerto: Number(process.env.PUERTO) || 3000,
  db: {
    // Dirección de la base PostgreSQL (Supabase). Se copia del panel de Supabase.
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fppt',
    // auto = cifrado (SSL) en todas las bases que no estén en esta misma computadora
    ssl: (process.env.DB_SSL || 'auto').toLowerCase(),
    // Opcional: certificado de Supabase para verificar que la conexión es auténtica
    certificado: process.env.DB_SSL_CERTIFICADO || '',
    // Conexiones abiertas a la vez. El plan gratis de Supabase tiene pocas: no subir mucho.
    conexiones: Number(process.env.DB_CONEXIONES) || 4,
  },
  // Lista de dominios permitidos para registrarse. Vacía = se acepta cualquiera.
  emailDominios: (process.env.EMAIL_DOMINIO || '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean),
  sesionSecreto: process.env.SESION_SECRETO || 'cambiar-esta-clave-en-el-servidor',
  produccion: process.env.NODE_ENV === 'production',
  zipMaxMb: Number(process.env.ZIP_MAX_MB) || 250,
  // Carpeta donde se guardan los ZIP subidos (fuera de "public": no se pueden abrir directo)
  carpetaZips: path.join(__dirname, '..', '..', 'storage', 'zips'),
};

module.exports = config;
