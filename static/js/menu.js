document.addEventListener('DOMContentLoaded', function () {
  // Función para resaltar la opción seleccionada en el menú
  function highlightMenuOption(selectedElement) {
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.remove('selected'); // Elimina la clase 'selected' de todos los elementos del menú
    });
    selectedElement.classList.add('selected'); // Agrega la clase 'selected' al elemento seleccionado
  }

  // Función para cargar contenido dinámicamente desde una URL
  function loadContent(url, callback) {
    fetch(url) // Realiza una solicitud fetch a la URL proporcionada
      .then(response => response.text()) // Convierte la respuesta a texto
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data; // Inserta el contenido cargado en el div con id 'contentMenu'
        if (typeof callback === 'function') callback(); // Ejecuta el callback si se proporciona

        // Inicializa la funcionalidad de ordenamiento después de cargar el nuevo contenido
        attachSortHandlers('tablaSolicitudesMemo');
        attachSortHandlers('tablaSolicitudesCorreo');

        // Inicializa la paginación y la búsqueda para ambas tablas después de cargar el contenido
        paginateTable('tablaSolicitudesMemo', 'paginationMemo', 6);
        paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 6);

        // Agrega un evento para el botón de estadísticas después de que el contenido se haya cargado
        const statsButton = document.getElementById('statisticsButton');
        if (statsButton) {
          statsButton.addEventListener('click', function () {
            loadContent('/bnup/statistics/', function () {
              loadStatisticsScript(); // Carga el archivo statisticsChart.js
            });
          });
        }

        // Agrega un evento para el botón de regreso a BNUP después de que el contenido se haya cargado
        const backButton = document.getElementById('backToBNUP');
        if (backButton) {
          backButton.addEventListener('click', function () {
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) {
              bnupLink.click(); // Simula un clic en el ítem de menú BNUP
            }
          });
        }
      })
      .catch(error => console.error(`Error al cargar ${url}:`, error)); // Maneja errores en la carga del contenido
  }

  // Función para cargar el archivo statisticsChart.js de forma dinámica
  function loadStatisticsScript() {
    const script = document.createElement('script');
    script.src = '/static/js/statisticsChart.js';
    script.onload = createCharts; // Llama a createCharts después de cargar el script
    document.head.appendChild(script);
  }

  // Definición de las rutas de las diferentes secciones del menú
  const menuItems = {
    'BNUP': '/bnup/',
    'PatenteAlcohol': '/patente_alcohol/',
    'InformeTerreno': '/informe_terreno/',
    'Inicio': '/inicio/',
    'PortalTransparencia': '/portal_transparencia/',
    'mapoteca': '/mapoteca/'
  };

  // Asigna un evento de clic a cada ítem del menú
  Object.entries(menuItems).forEach(([key, url]) => {
    document.querySelector(`a[data-content="${key}"]`).addEventListener('click', function (event) {
      event.preventDefault(); // Previene el comportamiento predeterminado del enlace
      highlightMenuOption(this); // Resalta la opción seleccionada en el menú
      loadContent(url, key === 'BNUP' ? updateBNUPFields : null); // Carga el contenido correspondiente, pasando updateBNUPFields como callback si es BNUP
    });
  });

  // Carga el contenido inicial y resalta la opción 'Inicio' en el menú
  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));

    // Verifica si hay una redirección a BNUP almacenada en la sesión
    if (sessionStorage.getItem('redirectToBNUP') === 'true') {
      const bnupLink = document.querySelector('a[data-content="BNUP"]');
      if (bnupLink) {
        bnupLink.click(); // Simula un clic en el ítem de menú BNUP
      }
      sessionStorage.removeItem('redirectToBNUP'); // Elimina la bandera de redirección de la sesión
    }
  });

  // Verifica si el servidor ha configurado una redirección a BNUP
  if (window.redirectToBNUP) {
    sessionStorage.setItem('redirectToBNUP', 'true'); // Almacena una bandera de redirección en la sesión
  }
});
