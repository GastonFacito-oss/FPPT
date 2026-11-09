// Página de detalle de un proyecto.
// Proyectos de ejemplo: el botón de descarga solo muestra un aviso.
(function () {
  var boton = document.querySelector('[data-descarga-demo]');
  var nota = document.querySelector('[data-nota-descarga]');
  if (!boton || !nota) return;
  boton.addEventListener('click', function () {
    nota.textContent = 'Este es un proyecto de ejemplo: su ZIP no existe. Probá con un proyecto subido desde "Subir proyecto".';
    nota.classList.add('nota-descarga--activa');
  });
})();
