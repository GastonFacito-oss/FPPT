// Preguntas por consola para los comandos de administración.
// Las líneas que se escriben se guardan en una cola: así funciona tanto si se
// responde de a una pregunta como si se pegan varias respuestas juntas.
const readline = require('readline');

let consola = null;
let ocultar = false;
let terminado = false;
const cola = [];
let esperando = null;

function abrir() {
  if (consola) return;
  consola = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  // Mientras se escribe una contraseña, no se muestran las letras
  const escribir = consola._writeToOutput.bind(consola);
  consola._writeToOutput = (cadena) => {
    if (!ocultar) escribir(cadena);
  };
  consola.on('line', (linea) => {
    if (esperando) {
      const entregar = esperando;
      esperando = null;
      entregar(linea);
    } else {
      cola.push(linea);
    }
  });
  consola.on('close', () => {
    terminado = true;
    if (esperando) esperando(null);
  });
}

// Hace una pregunta y devuelve la respuesta. Con oculta = true no muestra lo que se escribe.
function preguntar(texto, { oculta = false } = {}) {
  abrir();
  process.stdout.write(texto);
  ocultar = oculta;
  return new Promise((resolver) => {
    const entregar = (linea) => {
      if (oculta) process.stdout.write('\n');
      ocultar = false;
      resolver(linea === null ? '' : linea.trim());
    };
    if (cola.length) entregar(cola.shift());
    else if (terminado) entregar(null);
    else esperando = entregar;
  });
}

function cerrar() {
  if (consola) consola.close();
}

module.exports = { preguntar, cerrar };
