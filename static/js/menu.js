// menu.js

document.addEventListener('DOMContentLoaded', function () {
  let originalBgColor = '';

  function highlightMenuOption(selectedElement) {
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.remove('selected', 'selected-login');
    });

    if (selectedElement.getAttribute('data-content') === 'login') {
      selectedElement.classList.add('selected-login');
    } else {
      selectedElement.classList.add('selected');
    }
  }

  // menu.js

  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data;
        if (typeof callback === 'function') callback();

        if (url === '/bnup/') {  // Cambiado para cargar bnup_form.js solo en la página principal de BNUP
          const script = document.createElement('script');
          script.src = '/static/js/bnup_form.js';
          script.onload = function () {
            updateBNUPFields();
            initializeFileModal();
            initializeBNUPFormModal();
            initializeRowSelection();
            borde_thead();

            // Inicializar la tabla aquí
            const rowsPerPage = getRowsPerPage();
            initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');

            // Después de inicializar la tabla, remover la clase 'hidden-table'
            const table = document.getElementById('tablaSolicitudes');
            if (table) {
              table.classList.remove('hidden-table');
            }

            // Añadir el event listener al botón de estadísticas
            const statsButton = document.getElementById('statisticsButton');
            if (statsButton) {
              statsButton.addEventListener('click', function () {
                loadContent('/bnup/statistics/', function () {
                  loadStatisticsScript();
                });
              });
            }
          };
          document.head.appendChild(script);
        }

        // Lógica para cargar el script de estadísticas cuando se navega a la página de estadísticas
        if (url.includes('/bnup/statistics/')) {
          changeCardDetailsBgColor('#C9E8F4');
          loadStatisticsScript(); // Cargar el script de estadísticas
        } else {
          resetCardDetailsBgColor();
        }

        // Añadir el event listener al botón de regresar en la página de estadísticas
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


  function removeSelectedLogin() {
    const loginLink = document.querySelector('a[data-content="login"]');
    if (loginLink) {
      loginLink.classList.remove('selected-login');
    }
  }

  function changeCardDetailsBgColor(color) {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      originalBgColor = cardDetails.style.backgroundColor || '';
      cardDetails.style.backgroundColor = color;
    }
  }

  function resetCardDetailsBgColor() {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      cardDetails.style.backgroundColor = originalBgColor;
    }
  }

  function loadStatisticsScript() {
    const script = document.createElement('script');
    script.src = '/static/js/statisticsChart.js';
    script.onload = createCharts; // Asegúrate de que la función createCharts esté definida en statisticsChart.js
    document.head.appendChild(script);
  }

  const menuItems = {
    'BNUP': '/bnup/',
    'PatenteAlcohol': '/patente_alcohol/',
    'InformeTerreno': '/informe_terreno/',
    'Inicio': '/inicio/',
    'PortalTransparencia': '/portal_transparencia/',
    'mapoteca': '/mapoteca/',
    'login': '/login/'
  };

  Object.entries(menuItems).forEach(([key, url]) => {
    const menuLink = document.querySelector(`a[data-content="${key}"]`);
    if (menuLink) {
      menuLink.addEventListener('click', function (event) {
        event.preventDefault();
        highlightMenuOption(this);
        loadContent(url, key === 'BNUP' ? updateBNUPFields : null);
      });
    }
  });

  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));

    if (sessionStorage.getItem('redirectToBNUP') === 'true') {
      const bnupLink = document.querySelector('a[data-content="BNUP"]');
      if (bnupLink) {
        bnupLink.click();
      }
      sessionStorage.removeItem('redirectToBNUP');
    }
  });

  if (window.redirectToBNUP) {
    sessionStorage.setItem('redirectToBNUP', 'true');
  }

  const loginLink = document.querySelector('a[data-content="login"]');
  if (loginLink) {
    loginLink.addEventListener('click', function (event) {
      event.preventDefault();
      loadContent('/login/');
    });
  }
});
