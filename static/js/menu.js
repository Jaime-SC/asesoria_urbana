// static/js/menu.js

document.addEventListener('DOMContentLoaded', function () {
  let originalBgColor = '';

  /**
   * Resalta la opción de menú seleccionada.
   * @param {HTMLElement} selectedElement - El elemento de enlace del menú seleccionado.
   */
  function highlightMenuOption(selectedElement) {
    // Elimina las clases 'selected' y 'selected-login' de todos los enlaces del menú
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.remove('selected', 'selected-login');
    });

    // Añade la clase adecuada al enlace de menú seleccionado
    if (selectedElement.getAttribute('data-content') === 'login') {
      selectedElement.classList.add('selected-login');
    } else {
      selectedElement.classList.add('selected');
    }
  }

  /**
 * Carga contenido vía AJAX e inicializa scripts específicos de la página.
 * @param {string} url - La URL desde la cual obtener el contenido.
 * @param {Function} [callback] - Función de devolución de llamada opcional para ejecutar después de cargar el contenido.
 */
  /**
 * Carga contenido vía AJAX e inicializa scripts específicos de la página.
 * @param {string} url - La URL desde la cual obtener el contenido.
 * @param {Function} [callback] - Función de devolución de llamada opcional para ejecutar después de cargar el contenido.
 */
  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        // Actualiza el área de contenido con los datos obtenidos
        document.getElementById('contentMenu').innerHTML = data;

        // Maneja la carga de scripts específicos de la página
        if (url === '/bnup/') {
          // Carga dinámicamente bnup_form.js
          const script = document.createElement('script');
          script.src = '/static/js/bnup_form.js';
          script.onload = function () {
            // Inicializa las funcionalidades de la página BNUP
            initializeBNUPPage();
            updateBNUPFields();
            initializeFileModal();
            initializeBNUPFormModal();
            borde_thead();

            // Inicializa la tabla
            const rowsPerPage = getRowsPerPage();
            initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');

            // Obtener la tabla y los encabezados
            const table = document.getElementById('tablaSolicitudes');
            if (table) {
              const headers = table.querySelectorAll('thead th');

              // Encontrar el índice de la columna 'Nº Ingre' (numero_ingreso)
              let columnIndex = -1;
              headers.forEach((header, index) => {
                if (header.classList.contains('nIngre')) {
                  columnIndex = index;
                }
              });

              // Si se encontró la columna, ordenar la tabla inicialmente de mayor a menor
              if (columnIndex !== -1) {
                sortTable(table, columnIndex, 'number', false); // Orden descendente
                // Añadir indicador visual de ordenamiento al encabezado
                headers.forEach(h => h.classList.remove('ascending', 'descending'));
                headers[columnIndex].classList.add('descending'); // Indicador descendente
              }

              // Elimina la clase 'hidden-table' después de inicializar la tabla
              table.classList.remove('hidden-table');
            }

            // Añade el event listener al botón de estadísticas
            const statsButton = document.getElementById('statisticsButton');
            if (statsButton) {
              statsButton.addEventListener('click', function () {
                loadContent('/bnup/statistics/');
              });
            }

            if (typeof callback === 'function') callback();
          };
          document.head.appendChild(script);
        } else if (url.includes('/bnup/statistics/')) {
          // Cambia el color de fondo de la tarjeta de estadísticas
          changeCardDetailsBgColor('#C9E8F4');
          // Carga el script de estadísticas
          loadStatisticsScript();
          // Carga dinámicamente report.js para exportar el reporte
          const reportScript = document.createElement('script');
          reportScript.src = '/static/js/report.js';
          reportScript.onload = function () {
            // Opcional: se puede inicializar alguna función específica del reporte
            console.log("report.js cargado correctamente.");
          };
          document.head.appendChild(reportScript);
          // Llama a la inicialización de paginación después de insertar el contenido
          setTimeout(initializeStatisticsPagination, 300);
          if (typeof callback === 'function') callback();
        } else if (url === '/patente_alcohol/') {
          const script = document.createElement('script');
          script.src = '/static/js/patente_alcohol.js';
          script.onload = function () {
            // Inicializar funcionalidades específicas de la página de Patente de Alcohol
            initializePatenteAlcoholForm();
            initializePatenteAlcoholTable();
            initializeSelectAllCheckbox();  // Inicializar el checkbox "Select All"
            initializeGenerateCombinedPDFButton();
          };
          document.head.appendChild(script);
        } else {
          resetCardDetailsBgColor();
          if (typeof callback === 'function') callback();
        }

        // Añade el event listener al botón de regresar en la página de estadísticas
        const backButton = document.getElementById('backToBNUP');
        if (backButton) {
          backButton.addEventListener('click', function () {
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) {
              bnupLink.click();
            }
          });
        }
      })
      .catch(error => console.error(`Error al cargar ${url}:`, error));
  }



  /**
   * Cambia el color de fondo de los detalles de la tarjeta.
   * @param {string} color - El nuevo color de fondo.
   */
  function changeCardDetailsBgColor(color) {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      originalBgColor = cardDetails.style.backgroundColor || '';
      cardDetails.style.backgroundColor = color;
    }
  }

  /**
   * Restablece el color de fondo de los detalles de la tarjeta al original.
   */
  function resetCardDetailsBgColor() {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      cardDetails.style.backgroundColor = originalBgColor;
    }
  }

  /**
   * Carga dinámicamente el script de estadísticas y inicializa los gráficos.
   */
  function loadStatisticsScript() {
    const script = document.createElement('script');
    script.src = '/static/js/statisticsChart.js';
    script.onload = createCharts; // Asume que createCharts está definido en statisticsChart.js
    document.head.appendChild(script);
  }

  // Define los elementos del menú y sus URLs correspondientes
  const menuItems = {
    'BNUP': '/bnup/',
    'PatenteAlcohol': '/patente_alcohol/',
    'InformeTerreno': '/informe_terreno/',
    'Inicio': '/inicio/',
    'PortalTransparencia': '/portal_transparencia/',
    'mapoteca': '/mapoteca/',
    'login': '/login/',
    'Estadísticas': '/bnup/statistics/',  // Página de estadísticas 1 (la actual)
    'Estadísticas 2': '/bnup/statistics2/' // Nueva ruta para estadísticas 2 (opcional)

  };

  // Configura los event listeners para los elementos del menú
  Object.entries(menuItems).forEach(([key, url]) => {
    const menuLink = document.querySelector(`a[data-content="${key}"]`);
    if (menuLink) {
      menuLink.addEventListener('click', function (event) {
        event.preventDefault();
        highlightMenuOption(this);
        loadContent(url);
      });
    }
  });

  // Carga el contenido inicial
  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));

    // Redirige a la página BNUP si es necesario
    if (sessionStorage.getItem('redirectToBNUP') === 'true') {
      const bnupLink = document.querySelector('a[data-content="BNUP"]');
      if (bnupLink) {
        bnupLink.click();
      }
      sessionStorage.removeItem('redirectToBNUP');
    }
  });

  // Verifica si es necesario redirigir a BNUP al cargar la página
  if (window.redirectToBNUP) {
    sessionStorage.setItem('redirectToBNUP', 'true');
  }
});
