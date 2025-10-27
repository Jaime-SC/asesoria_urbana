// static/js/menu.js

document.addEventListener('DOMContentLoaded', function () {
  let originalBgColor = '';
  let firstLoad = true;  // ← bandera para la primera carga
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
  // Al inicio de menu.js (o justo antes de loadContent)
  function showLoader() {
    document.getElementById('globalLoader').style.display = 'block';
    document.querySelector('.cardContent')?.classList.add('blur-bg');
  }
  function hideLoader() {
    document.getElementById('globalLoader').style.display = 'none';
    document.querySelector('.cardContent')?.classList.remove('blur-bg');
  }



  function loadContent(url, callback) {
    if (!firstLoad) {
      showLoader();
    }

    fetch(url)
      .then(response => response.text())
      .then(data => {
        if (!firstLoad) {
          hideLoader();
        }
        firstLoad = false;   // ya no será la primera

        // Actualiza el área de contenido con los datos obtenidos
        document.getElementById('contentMenu').innerHTML = data;

        // --- resto de tu lógica sin cambios ---
        if (url === '/bnup/') {
          const script = document.createElement('script');
          script.src = '/static/js/bnup_form.js';
          script.onload = function () {
            initializeBNUPPage();
            updateBNUPFields();
            initIngresoFileCard();
            initializeBNUPFormModal();

            const rowsPerPage = getRowsPerPage();
            initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');

            const table = document.getElementById('tablaSolicitudes');
            if (table) {
              const headers = table.querySelectorAll('thead th');
              let columnIndex = -1;
              headers.forEach((header, index) => {
                if (header.classList.contains('nIngre')) columnIndex = index;
              });
              if (columnIndex !== -1) {
                sortTable(table, columnIndex, 'number', false);
                headers.forEach(h => h.classList.remove('ascending', 'descending'));
                headers[columnIndex].classList.add('descending');
              }
              table.classList.remove('hidden-table');
            }

            const statsButton = document.getElementById('statisticsButton');
            if (statsButton) statsButton.addEventListener('click', () => loadContent('/bnup/statistics/'));
            if (typeof callback === 'function') callback();
          };
          document.head.appendChild(script);

        } else if (url.includes('/bnup/statistics/')) {
          changeCardDetailsBgColor('#C9E8F4');
          loadStatisticsScript();
          const reportScript = document.createElement('script');
          reportScript.src = '/static/js/report.js';
          reportScript.onload = () => console.log("report.js cargado correctamente.");
          document.head.appendChild(reportScript);
          setTimeout(initializeStatisticsPagination, 300);
          if (typeof callback === 'function') callback();

        } else if (url === '/patente_alcohol/') {
          const script = document.createElement('script');
          script.src = '/static/js/patente_alcohol.js';
          script.onload = function () {
            initializePatenteAlcoholForm();
            initializePatenteAlcoholTable();
            initializeSelectAllCheckbox();
            initializeGenerateCombinedPDFButton();
          };
          document.head.appendChild(script);

        } else {
          resetCardDetailsBgColor();
          if (typeof callback === 'function') callback();
        }

        const backButton = document.getElementById('backToBNUP');
        if (backButton) {
          backButton.addEventListener('click', () => {
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) bnupLink.click();
          });
        }
      })
      .catch(error => {
        if (!firstLoad) hideLoader();
        console.error(`Error al cargar ${url}:`, error);
      });
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
