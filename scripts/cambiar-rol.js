// Cambia el rol de una cuenta: estudiante, docente o admin.
// Uso:  npm run cambiar-rol -- email@escuela.edu.ar docente
const { pool, consultar } = require('../src/config/db');

const ROLES = ['estudiante', 'docente', 'admin'];

async function main() {
  const [email = '', rol = ''] = process.argv.slice(2).map((v) => v.trim().toLowerCase());
  if (!email || !ROLES.includes(rol)) {
    console.log('Uso: npm run cambiar-rol -- email@escuela.edu.ar docente');
    console.log('Roles posibles: ' + ROLES.join(', '));
    process.exitCode = 1;
    return;
  }
  const [usuario] = await consultar('SELECT id, nombre FROM usuarios WHERE email = ?', [email]);
  if (!usuario) {
    console.error(`✖ No hay ninguna cuenta con el email ${email}.`);
    process.exitCode = 1;
    return;
  }
  await consultar('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, usuario.id]);
  console.log(`✔ ${usuario.nombre} ahora es ${rol}.`);
}

main()
  .catch((err) => {
    console.error('No se pudo cambiar el rol:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
