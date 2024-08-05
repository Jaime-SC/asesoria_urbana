document.addEventListener('DOMContentLoaded', function () {
  function highlightMenuOption(selectedElement) {
    document.querySelectorAll('a[data-content]').forEach(item => {
      item.classList.toggle('selected', item === selectedElement);
    });
  }

  function loadContent(url, callback) {
    fetch(url)
      .then(response => response.text())
      .then(data => {
        document.getElementById('contentMenu').innerHTML = data;
        if (typeof callback === 'function') callback();
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
      highlightMenuOption(this);
      loadContent(url, key === 'BNUP' ? updateBNUPFields : null);
    });
  });

  // Load the initial content
  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));
  });
});
