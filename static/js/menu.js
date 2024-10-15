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

  // menu.js

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
          };
          document.head.appendChild(script);
        }

        // Asegúrate de no tener llamadas duplicadas a la inicialización de la tabla fuera de este bloque
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
