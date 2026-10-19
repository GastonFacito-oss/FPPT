// Punto de entrada: arranca el servidor web.
const app = require('./app');
const config = require('./config');

// En producción, no arranca si la configuración es insegura
const { errores, avisos } = config.revisarConfiguracion();
for (const aviso of avisos) console.warn('⚠ ' + aviso);
if (errores.length) {
  console.error('✖ El sitio no arrancó: hay que corregir el archivo .env');
  for (const error of errores) console.error('  - ' + error);
  process.exit(1);
}

const servidor = app.listen(config.puerto, config.host || undefined, () => {
  const modo = config.produccion ? 'modo producción' : 'modo desarrollo';
  console.log(`FPPT funcionando en http://localhost:${config.puerto} (${modo})`);
});

// Subir un ZIP de 250 MB con una conexión lenta puede tardar varios minutos.
// Node corta los pedidos a los 5 minutos: lo subimos a 30.
servidor.requestTimeout = 30 * 60 * 1000;
