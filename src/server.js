// Punto de entrada: arranca el servidor web.
const app = require('./app');
const config = require('./config');

const servidor = app.listen(config.puerto, () => {
  console.log(`FPPT funcionando en http://localhost:${config.puerto}`);
});

// Subir un ZIP de 250 MB con una conexión lenta puede tardar varios minutos.
// Node corta los pedidos a los 5 minutos: lo subimos a 30.
servidor.requestTimeout = 30 * 60 * 1000;
