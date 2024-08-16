document.addEventListener('DOMContentLoaded', function () {
  let originalBgColor = ''; // Cambia 'const' a 'let' para permitir la reasignación

  function highlightMenuOption(selectedElement) {
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.remove('selected'); // Elimina la clase 'selected' de todos los elementos del menú
    });
    selectedElement.classList.add('selected'); // Agrega la clase 'selected' al elemento seleccionado
  }

  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data;
        if (typeof callback === 'function') callback();

        attachSortHandlers('tablaSolicitudesMemo');
        attachSortHandlers('tablaSolicitudesCorreo');

        paginateTable('tablaSolicitudesMemo', 'paginationMemo', 6);
        paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 6);

        // Cambiar el fondo al color deseado si es la página de estadísticas
        if (url.includes('/bnup/statistics/')) {
          changeCardDetailsBgColor('#C9E8F4');
        } else {
          resetCardDetailsBgColor();
        }

        const statsButton = document.getElementById('statisticsButton');
        if (statsButton) {
          statsButton.addEventListener('click', function () {
            loadContent('/bnup/statistics/', function () {
              loadStatisticsScript(); // Carga el archivo statisticsChart.js
            });
          });
        }

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
      .catch(error => console.error(`Error al cargar ${url}:`, error));
  }

  function changeCardDetailsBgColor(color) {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      originalBgColor = cardDetails.style.backgroundColor || ''; // Guarda el color original
      cardDetails.style.backgroundColor = color; // Cambia al nuevo color
    }
  }

  function resetCardDetailsBgColor() {
    const cardDetails = document.querySelector('.cardContent');
    if (cardDetails) {
      cardDetails.style.backgroundColor = originalBgColor; // Restaura el color original
    }
  }

  function loadStatisticsScript() {
    const script = document.createElement('script');
    script.src = '/static/js/statisticsChart.js';
    script.onload = createCharts; // Llama a createCharts después de cargar el script
    document.head.appendChild(script);
  }

  const menuItems = {
    'BNUP': '/bnup/',
    'PatenteAlcohol': '/patente_alcohol/',
    'InformeTerreno': '/informe_terreno/',
    'Inicio': '/inicio/',
    'PortalTransparencia': '/portal_transparencia/',
    'mapoteca': '/mapoteca/'
  };

  Object.entries(menuItems).forEach(([key, url]) => {
    document.querySelector(`a[data-content="${key}"]`).addEventListener('click', function (event) {
      event.preventDefault();
      highlightMenuOption(this);
      loadContent(url, key === 'BNUP' ? updateBNUPFields : null);
    });
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
});
