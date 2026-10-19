// Crea la base "fppt".
//
//   Modo desarrollo:  BORRA la base y la crea de nuevo con datos de prueba
//                     (cuentas y proyectos ficticios) para probar el sitio.
//   Modo producción (NODE_ENV=production en el .env):
//                     crea la base vacía, SIN cuentas de prueba, y solo si todavía no existe.
//                     Si ya tiene datos, no toca nada. Después: npm run crear-admin
//
// Uso:  npm run db:crear
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function main() {
  const conexion = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    const [[{ tablas }]] = await conexion.query(
      "SELECT COUNT(*) AS tablas FROM information_schema.tables WHERE table_schema = 'fppt'"
    );

    if (config.produccion && tablas > 0) {
      console.log('✔ La base "fppt" ya existe. En modo producción este comando no borra nada.');
      console.log('  Para crear la cuenta de administrador: npm run crear-admin');
      return;
    }

    const archivos = config.produccion
      ? ['schema.sql', 'datos-base.sql']
      : ['schema.sql', 'datos-base.sql', 'seed.sql'];
    for (const archivo of archivos) {
      await conexion.query(fs.readFileSync(path.join(__dirname, archivo), 'utf8'));
      console.log(`✔ ${archivo} ejecutado`);
    }
  } finally {
    await conexion.end();
  }

  // La base nueva no tiene proyectos subidos: se borran los ZIP que hubiera de antes
  fs.mkdirSync(config.carpetaZips, { recursive: true });
  const zips = fs.readdirSync(config.carpetaZips).filter((nombre) => nombre.endsWith('.zip'));
  for (const nombre of zips) fs.unlinkSync(path.join(config.carpetaZips, nombre));
  if (zips.length) console.log(`✔ ${zips.length} ZIP subidos antes borrados de storage/zips`);

  if (config.produccion) {
    console.log('Base de datos "fppt" lista y vacía (sin cuentas de prueba).');
    console.log('Ahora creá la cuenta de administrador: npm run crear-admin');
  } else {
    console.log('Base de datos "fppt" lista, con datos de prueba.');
  }
}

main().catch((err) => {
  console.error('No se pudo crear la base:', err.message);
  console.error('¿Está MySQL encendido? ¿Los datos de la base en el archivo .env son correctos?');
  process.exitCode = 1;
});
