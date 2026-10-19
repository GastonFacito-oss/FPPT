// Crea la cuenta de administrador (o convierte una cuenta existente en admin).
// Uso:  npm run crear-admin
const bcrypt = require('bcryptjs');
const { pool, consultar } = require('../src/config/db');
const { limpiarRegistro, validarRegistro } = require('../src/services/validaciones');
const { preguntar, cerrar } = require('./consola');

async function main() {
  console.log('Crear cuenta de administrador de FPPT\n');
  const email = (await preguntar('Email: ')).toLowerCase();

  // Si la cuenta ya existe, solo se le cambia el rol
  const [existente] = await consultar('SELECT id, nombre, rol FROM usuarios WHERE email = ?', [email]);
  if (existente) {
    if (existente.rol === 'admin') return console.log(`${existente.nombre} ya es administrador.`);
    const respuesta = await preguntar(`${existente.nombre} ya tiene cuenta (${existente.rol}). ¿Hacerlo administrador? (s/n): `);
    if (respuesta.toLowerCase() !== 's') return console.log('Cancelado.');
    await consultar("UPDATE usuarios SET rol = 'admin' WHERE id = ?", [existente.id]);
    return console.log(`✔ ${existente.nombre} ahora es administrador.`);
  }

  const datos = limpiarRegistro({
    email,
    nombre: await preguntar('Nombre y apellido: '),
    dni: await preguntar('DNI (solo números): '),
    password: await preguntar('Contraseña (no se ve al escribir): ', { oculta: true }),
    password2: await preguntar('Repetí la contraseña: ', { oculta: true }),
  });

  const errores = validarRegistro(datos);
  if (Object.keys(errores).length) {
    console.error('\n✖ No se creó la cuenta:');
    for (const mensaje of Object.values(errores)) console.error('  - ' + mensaje);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(datos.password, 10);
  try {
    await consultar(
      "INSERT INTO usuarios (nombre, email, dni, password_hash, rol) VALUES (?, ?, ?, ?, 'admin')",
      [datos.nombre, datos.email, datos.dni, passwordHash]
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err;
    console.error('\n✖ Ya existe una cuenta con ese DNI.');
    process.exitCode = 1;
    return;
  }
  console.log(`\n✔ Cuenta de administrador creada para ${datos.nombre}. Ya podés ingresar al sitio.`);
}

main()
  .catch((err) => {
    console.error('No se pudo crear la cuenta:', err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    cerrar();
    pool.end();
  });
