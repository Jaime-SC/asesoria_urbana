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

  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data;
        if (typeof callback === 'function') callback();

        if (url.includes('/bnup/')) {
          const script = document.createElement('script');
          script.src = '/static/js/bnup_form.js';
          script.onload = function () {
            updateBNUPFields();
            initializeFileModal();
            initializeBNUPFormModal();
            initializeRowSelection();  // Inicializar la selección de filas después de cargar el contenido
            borde_thead();
            // Asegúrate de que cualquier otra función nueva se inicialice aquí
          };
          document.head.appendChild(script);
        }

        // Adjuntar controladores de ordenación y paginación a la nueva tabla unificada
        attachSortHandlers('tablaSolicitudes');
        paginateTable('tablaSolicitudes', 'paginationSolicitudes', 12);

        if (url.includes('/bnup/statistics/')) {
          changeCardDetailsBgColor('#C9E8F4');
        } else {
          resetCardDetailsBgColor();
        }

        const statsButton = document.getElementById('statisticsButton');
        if (statsButton) {
          statsButton.addEventListener('click', function () {
            loadContent('/bnup/statistics/', function () {
              loadStatisticsScript();
            });
          });
        }

        const backButton = document.getElementById('backToBNUP');
        if (backButton) {
          backButton.addEventListener('click', function () {
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) {
              bnupLink.click();
            }
          });
        }

        const backToInicioButton = document.getElementById('backToInicio');
        if (backToInicioButton) {
          backToInicioButton.addEventListener('click', function () {
            loadContent('/inicio/', function () {
              removeSelectedLogin();
            });
          });
        }

        // Verificar si se debe redirigir a BNUP
        if (window.redirectToBNUP) {
          const bnupLink = document.querySelector('a[data-content="BNUP"]');
          if (bnupLink) {
            highlightMenuOption(bnupLink);
            loadContent('/bnup/');
          }
          window.redirectToBNUP = false;
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
    script.onload = createCharts;
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
