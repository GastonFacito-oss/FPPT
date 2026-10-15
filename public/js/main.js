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

// Búsqueda de proyectos:
// - al elegir un filtro, se busca sin tener que tocar "Buscar";
// - los campos vacíos no se envían, así la dirección queda corta (/proyectos?materia=Proyecto+3).
(function () {
  var formularios = document.querySelectorAll('form[role="search"]');

  formularios.forEach(function (form) {
    form.addEventListener('submit', function () {
      Array.prototype.forEach.call(form.elements, function (campo) {
        if (campo.name && campo.value === '') campo.disabled = true;
      });
    });
  });

  document.querySelectorAll('[data-enviar-al-cambiar]').forEach(function (campo) {
    campo.addEventListener('change', function () {
      if (campo.form.requestSubmit) campo.form.requestSubmit(); // dispara el "submit" de arriba
      else campo.form.submit();
    });
  });

  // Al volver con el botón "Atrás", los campos tienen que estar habilitados de nuevo
  window.addEventListener('pageshow', function () {
    formularios.forEach(function (form) {
      Array.prototype.forEach.call(form.elements, function (campo) { campo.disabled = false; });
    });
  });
})();
