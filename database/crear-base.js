// Crea la base "fppt" desde cero y carga los datos de prueba.
// Uso:  npm run db:crear
// ¡Borra todo lo que haya en la base "fppt" y los ZIP subidos!
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

  for (const archivo of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, archivo), 'utf8');
    await conexion.query(sql);
    console.log(`✔ ${archivo} ejecutado`);
  }

  await conexion.end();

  // La base nueva no tiene proyectos subidos: se borran los ZIP que hubiera de antes
  fs.mkdirSync(config.carpetaZips, { recursive: true });
  const zips = fs.readdirSync(config.carpetaZips).filter((nombre) => nombre.endsWith('.zip'));
  for (const nombre of zips) fs.unlinkSync(path.join(config.carpetaZips, nombre));
  if (zips.length) console.log(`✔ ${zips.length} ZIP subidos antes borrados de storage/zips`);

  console.log('Base de datos "fppt" lista.');
}

main().catch((err) => {
  console.error('No se pudo crear la base:', err.message);
  console.error('¿Está MySQL encendido en XAMPP? ¿Los datos del archivo .env son correctos?');
  process.exit(1);
});
