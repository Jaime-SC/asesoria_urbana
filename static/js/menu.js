document.addEventListener('DOMContentLoaded', function () {
  function highlightMenuOption(selectedElement) {
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.remove('selected'); // Remove 'selected' class from all items
    });
    selectedElement.classList.add('selected'); // Add 'selected' class to the clicked item
  }

  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data;
        if (typeof callback === 'function') callback();

        // Initialize sorting after loading new content
        attachSortHandlers('tablaSolicitudesMemo');
        attachSortHandlers('tablaSolicitudesCorreo');

        // Initialize pagination and search for both tables
        paginateTable('tablaSolicitudesMemo', 'paginationMemo', 6);
        paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 6);

        // Add event listener for the statistics button after content is loaded
        const statsButton = document.getElementById('statisticsButton');
        if (statsButton) {
          statsButton.addEventListener('click', function () {
            loadContent('/bnup/statistics/'); // Load statistics content dynamically
          });
        }

        // Add event listener for the back button to BNUP after content is loaded
        const backButton = document.getElementById('backToBNUP');
        if (backButton) {
          backButton.addEventListener('click', function () {
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) {
              bnupLink.click(); // Simulate click on BNUP menu item
            }
          });
        }
      })
      .catch(error => console.error(`Error al cargar ${url}:`, error));
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
      highlightMenuOption(this); // Highlight the selected menu item
      loadContent(url, key === 'BNUP' ? updateBNUPFields : null);
    });
  });

  // Load the initial content and highlight the 'Inicio' option
  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));

    // Check session storage for redirect to BNUP
    if (sessionStorage.getItem('redirectToBNUP') === 'true') {
      const bnupLink = document.querySelector('a[data-content="BNUP"]');
      if (bnupLink) {
        bnupLink.click(); // Simulate click on BNUP menu item
      }
      sessionStorage.removeItem('redirectToBNUP'); // Clear the flag
    }
  });

  // Check if the server set a flag to redirect to BNUP
  if (window.redirectToBNUP) {
    sessionStorage.setItem('redirectToBNUP', 'true');
  }
});
