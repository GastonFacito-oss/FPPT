// DATOS DE DEMOSTRACIÓN (Sprint 1).
// Simulan el ZIP de los dos primeros proyectos para mostrar cómo se verá el detalle.
// En el Sprint 4 esta información va a salir de la tabla "archivos_zip".
//
// Formato del árbol (el mismo que se guardará en archivos_zip.arbol_json):
//   carpeta: { nombre, hijos: [...] }
//   archivo: { nombre, tamanio }   (tamaño en bytes)

const carpeta = (nombre, hijos) => ({ nombre, hijos });
const archivo = (nombre, tamanio) => ({ nombre, tamanio });

const demos = {
  // FPPT
  1: {
    nombreZip: 'fppt-proyecto.zip',
    tamanio: 18_874_368,
    subido: '2026-09-29T10:30:00-03:00',
    arbol: [
      carpeta('fppt', [
        carpeta('database', [archivo('schema.sql', 6_144), archivo('seed.sql', 4_096)]),
        carpeta('docs', [
          archivo('plan.md', 9_216),
          archivo('sistema-de-diseno.md', 7_680),
          archivo('manual-de-usuario.pdf', 1_258_291),
          archivo('diagrama-arquitectura.png', 184_320),
        ]),
        carpeta('public', [
          carpeta('css', [archivo('estilos.css', 18_432)]),
          carpeta('img', [archivo('logo-fppt.png', 17_896), archivo('logo-et20.png', 78_477)]),
          carpeta('js', [archivo('main.js', 512), archivo('subir.js', 7_168)]),
        ]),
        carpeta('src', [
          carpeta('controllers', [archivo('authController.js', 4_608), archivo('proyectosController.js', 3_072)]),
          carpeta('models', [archivo('proyectoModel.js', 2_560), archivo('usuarioModel.js', 1_536)]),
          carpeta('routes', [archivo('index.js', 1_280)]),
          carpeta('views', [archivo('inicio.ejs', 2_304), archivo('proyecto-detalle.ejs', 4_352)]),
          archivo('app.js', 1_792),
          archivo('server.js', 256),
        ]),
        archivo('package.json', 640),
        archivo('README.md', 3_584),
      ]),
    ],
  },

  // Gestor de biblioteca
  2: {
    nombreZip: 'gestor-biblioteca.zip',
    tamanio: 42_991_616,
    subido: '2025-11-18T14:05:00-03:00',
    arbol: [
      carpeta('gestor-biblioteca', [
        carpeta('base-de-datos', [archivo('biblioteca.sql', 12_288), archivo('datos-de-prueba.sql', 20_480)]),
        carpeta('documentacion', [
          archivo('informe-final.pdf', 2_411_724),
          archivo('manual-de-usuario.pdf', 1_572_864),
          archivo('diagrama-de-clases.png', 356_352),
        ]),
        carpeta('lib', [archivo('mysql-connector-j-8.4.0.jar', 2_581_504)]),
        carpeta('src', [
          carpeta('biblioteca', [
            carpeta('modelo', [archivo('Libro.java', 3_072), archivo('Prestamo.java', 2_816), archivo('Socio.java', 2_304)]),
            carpeta('datos', [archivo('Conexion.java', 1_536), archivo('LibroDAO.java', 5_632), archivo('PrestamoDAO.java', 6_144)]),
            carpeta('vista', [archivo('VentanaPrincipal.java', 9_728), archivo('FormularioPrestamo.java', 7_424)]),
            archivo('Main.java', 768),
          ]),
        ]),
        archivo('GestorBiblioteca.jar', 3_145_728),
        archivo('LEEME.txt', 1_024),
      ]),
    ],
  },
};

function obtenerDemo(proyectoId) {
  return demos[proyectoId] || null;
}

module.exports = { obtenerDemo };
