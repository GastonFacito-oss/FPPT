// Crea las tablas de FPPT en la base (Supabase) y carga los datos de prueba.
//
//   npm run db:crear      -> solo si la base todavía está vacía (no borra nada)
//   npm run db:reiniciar  -> BORRA todas las tablas de FPPT y las crea de nuevo (pide confirmación)
//
// La base de Supabase la comparte todo el equipo: reiniciarla borra las cuentas
// y los proyectos de todos.
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { pool } = require('../src/config/db');
const config = require('../src/config');

const reiniciar = process.argv.includes('--reiniciar');
const sinPreguntar = process.argv.includes('--si');

async function main() {
  const [{ existe }] = (await pool.query("SELECT to_regclass('public.proyectos') IS NOT NULL AS existe")).rows;

  if (existe && !reiniciar) {
    console.log('✔ La base ya tiene las tablas de FPPT. No se borró nada.');
    console.log('  Para borrar TODO (cuentas y proyectos de todo el equipo) y empezar de cero:');
    console.log('  npm run db:reiniciar');
    return;
  }

  if (existe && !sinPreguntar) {
    const consola = readline.createInterface({ input: process.stdin, output: process.stdout });
    const respuesta = await consola.question(
      '⚠ Esto BORRA todas las cuentas y proyectos de la base que usa todo el equipo.\n' +
        '  Escribí BORRAR para confirmar: '
    );
    consola.close();
    if (respuesta.trim() !== 'BORRAR') {
      console.log('Cancelado. No se borró nada.');
      return;
    }
  }

  // Estructura + datos de prueba, todo junto: si algo falla, no queda nada a medias
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    for (const archivo of ['schema.sql', 'seed.sql']) {
      await cliente.query(fs.readFileSync(path.join(__dirname, archivo), 'utf8'));
      console.log(`✔ ${archivo} ejecutado`);
    }
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }

  // Los ZIP de esta computadora ya no corresponden a ningún proyecto: se borran
  fs.mkdirSync(config.carpetaZips, { recursive: true });
  const zips = fs.readdirSync(config.carpetaZips).filter((nombre) => nombre.endsWith('.zip'));
  for (const nombre of zips) fs.unlinkSync(path.join(config.carpetaZips, nombre));
  if (zips.length) console.log(`✔ ${zips.length} ZIP subidos antes borrados de storage/zips`);

  console.log('Base de datos lista.');
}

main()
  .catch((err) => {
    console.error('No se pudo preparar la base:', err.message);
    console.error('Revisá la dirección DATABASE_URL del archivo .env, que tengas internet');
    console.error('y que el proyecto de Supabase no esté pausado.');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
