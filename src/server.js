// Punto de entrada: arranca el servidor web.
const app = require('./app');
const config = require('./config');

app.listen(config.puerto, () => {
  console.log(`FPPT funcionando en http://localhost:${config.puerto}`);
});
