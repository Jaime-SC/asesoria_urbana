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
        attachSortHandlers('tablaSolicitudesMemo'); // Attach sort handlers to new content
        attachSortHandlers('tablaSolicitudesCorreo');
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
  });
});
