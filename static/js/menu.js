document.addEventListener('DOMContentLoaded', function () {
  function highlightMenuOption(element) {
    // Eliminar la clase 'selected' de todas las opciones
    document.querySelectorAll('a[data-content]').forEach((item) => {
      item.classList.remove('selected');
    });

    // Agregar la clase 'selected' a la opción seleccionada
    element.classList.add('selected');
  }

  document.querySelector('a[data-content="BNUP"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    fetch('/bnup/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
      })
      .catch((error) => console.error('Error al cargar BNUP:', error));
  });

  document.querySelector('a[data-content="PatenteAlcohol"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    fetch('/patente_alcohol/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
      })
      .catch((error) => console.error('Error al cargar Patente de Alcohol:', error));
  });

  document.querySelector('a[data-content="InformeTerreno"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    fetch('/informe_terreno/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
      })
      .catch((error) => console.error('Error al cargar Informe de Terreno:', error));
  });

  document.querySelector('a[data-content="Inicio"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    fetch('/inicio/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
      })
      .catch((error) => console.error('Error al cargar Inicio:', error));
  });

  document.querySelector('a[data-content="PortalTransparencia"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado
    highlightMenuOption(this); // Resaltar la opción seleccionada

    fetch('/portal_transparencia/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
      })
      .catch((error) => console.error('Error al cargar Portal de Transparencia:', error));
  });

  // Cargar el contenido de 'Inicio' al cargar la página y resaltar la opción 'Inicio'
  fetch('/inicio/')
    .then((response) => response.text())
    .then((data) => {
      document.getElementById('contentMenu').innerHTML = data;
      highlightMenuOption(document.querySelector('a[data-content="Inicio"]')); // Resaltar la opción 'Inicio'
    })
    .catch((error) => console.error('Error al cargar Inicio:', error));
});

