// Crea la base "fppt" desde cero y carga los datos de prueba.
// Uso:  npm run db:crear
// ¡Borra todo lo que haya en la base "fppt"!
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
  console.log('Base de datos "fppt" lista.');
}

main().catch((err) => {
  console.error('No se pudo crear la base:', err.message);
  console.error('¿Está MySQL encendido en XAMPP? ¿Los datos del archivo .env son correctos?');
  process.exit(1);
});
