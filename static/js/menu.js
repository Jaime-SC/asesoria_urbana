document.addEventListener('DOMContentLoaded', function () {
  function highlightMenuOption(element) {
    // Eliminar la clase 'selected' de todas las opciones
    document.querySelectorAll('a[data-content]').forEach((item) => {
      item.classList.remove('selected');
    });

    // Agregar la clase 'selected' a la opción seleccionada
    element.classList.add('selected');
  }

  function loadContent(url, callback) {
    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
        if (callback) callback(); // Llamar al callback si se proporciona
      })
      .catch((error) => console.error(`Error al cargar ${url}:`, error));
  }

  document.querySelector('a[data-content="BNUP"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    loadContent('/bnup/', function () {
      // Llamar a la función updateBNUPFields después de cargar el contenido
      updateBNUPFields();
    });
  });

  document.querySelector('a[data-content="PatenteAlcohol"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    loadContent('/patente_alcohol/');
  });

  document.querySelector('a[data-content="InformeTerreno"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    loadContent('/informe_terreno/');
  });

  document.querySelector('a[data-content="Inicio"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    loadContent('/inicio/');
  });

  document.querySelector('a[data-content="PortalTransparencia"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    loadContent('/portal_transparencia/');
  });

  // Cargar el contenido de 'Inicio' al cargar la página y resaltar la opción 'Inicio'
  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]')); // Resaltar la opción 'Inicio'
  });
});
