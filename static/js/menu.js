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

        // Asegúrate de que el contenido ha sido cargado antes de inicializar los elementos
        initializeFileModal();

        attachSortHandlers('tablaSolicitudesMemo');
        attachSortHandlers('tablaSolicitudesCorreo');
        paginateTable('tablaSolicitudesMemo', 'paginationMemo', 6);
        paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 6);

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
      })
      .catch(error => console.error(`Error al cargar ${url}:`, error));
  }

  function initializeFileModal() {
    const modalButton = document.getElementById('openFileModal');
    const closeModalButton = document.querySelector('.close');
    const fileModalInput = document.getElementById('fileModalInput');
    const archivoAdjuntoInput = document.getElementById('archivo_adjunto');

    if (modalButton) {
      modalButton.onclick = function () {
        document.getElementById('fileModal').style.display = 'block';
      };
    }

    if (closeModalButton) {
      closeModalButton.onclick = function () {
        document.getElementById('fileModal').style.display = 'none';
      };
    }

    window.onclick = function (event) {
      if (event.target === document.getElementById('fileModal')) {
        document.getElementById('fileModal').style.display = 'none';
      }
    };

    if (fileModalInput) {
      fileModalInput.onchange = function () {
        archivoAdjuntoInput.files = fileModalInput.files; // Pasar los archivos seleccionados en el modal al input oculto en el formulario
        document.getElementById('fileModal').style.display = 'none'; // Cerrar el modal después de seleccionar el archivo
      };

      $(fileModalInput).fileinput({
        showUpload: false,
        showRemove: true, // Mantén este botón visible
        showPreview: true,
        showCaption: false,
        browseLabel: '<span class="material-symbols-outlined">upload_file</span> Seleccionar archivo', // Icono para "Seleccionar archivo"
        removeLabel: '<span class="material-symbols-outlined">delete</span> Eliminar', // Icono para "Eliminar"
        mainClass: 'input-group-sm',
        fileActionSettings: {
          showRemove: true, // Mantén el botón de eliminación principal
          showZoom: false,
          showDrag: false,
          showDelete: false, // Asegúrate de que no haya un botón de cierre adicional
        },
        layoutTemplates: {
          close: '', // Remueve el botón de cierre adicional
          indicator: '', // Remueve el indicador de estado de subida
          actionCancel: '' // Remueve el botón de cancelar (oculta el botón de cancelar)
        }
      });
    }
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
