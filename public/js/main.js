// Menú desplegable para pantallas chicas.
(function () {
  var boton = document.querySelector('.menu-boton');
  var menu = document.getElementById('menu-principal');
  if (!boton || !menu) return;

  boton.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierta');
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    boton.textContent = abierto ? 'Cerrar' : 'Menú';
  });
})();
