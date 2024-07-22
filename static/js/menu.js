document.addEventListener('DOMContentLoaded', function () {
  function highlightMenuOption(element) {
    document.querySelectorAll('a[data-content]').forEach((item) => {
      item.classList.remove('selected');
    });
    element.classList.add('selected');
  }

  function loadContent(url, callback) {
    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data;
        if (callback) callback();
      })
      .catch((error) => console.error(`Error al cargar ${url}:`, error));
  }

  function updateBNUPFields() {
    document.querySelectorAll('input[name="recepcion"]').forEach((input) => {
      input.addEventListener('change', function () {
        document.getElementById('memoFields').style.display = this.value === 'memo' ? 'block' : 'none';
        document.getElementById('correoFields').style.display = this.value === 'correo' ? 'block' : 'none';
      });
    });

    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {
      type: 'bar',
      data: {

        labels: ['Funcionario 1', 'Funcionario 2', 'Funcionario 3'],

        datasets: [{
          label: '# de Recepciones',
          data: [1, 2, 2],
          backgroundColor: ['rgba(45, 148, 173, 0.5)', 'rgba(247, 234, 83, 0.5)', 'rgba(180, 49, 55, 0.5)'],
          borderColor: ['rgba(45, 148, 173, 1)', 'rgba(247, 234, 83, 1)', 'rgba(180, 49, 55, 1)'],

          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 10
            }
          }
        }
      }
    });

    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Memo', 'Correo'],
        datasets: [{
          label: '# de Recepciones',
          data: [12, 19],


          backgroundColor: ['rgba(45, 148, 173, 0.5)', 'rgba(247, 234, 83, 0.5)'],
          borderColor: ['rgba(45, 148, 173, 1)', 'rgba(247, 234, 83, 1)'],

          borderWidth: 1

        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 10
            }
          }
        }
      }
    });

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [{
          label: '# de Solicitudes',
          data: [3, 7, 4, 5, 6, 8],
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 10
            }
          }
        }
      }
    });
  }

  document.querySelector('a[data-content="BNUP"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/bnup/', updateBNUPFields);
  });

  document.querySelector('a[data-content="PatenteAlcohol"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/patente_alcohol/');
  });

  document.querySelector('a[data-content="InformeTerreno"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/informe_terreno/');
  });

  document.querySelector('a[data-content="Inicio"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/inicio/');
  });

  document.querySelector('a[data-content="PortalTransparencia"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/portal_transparencia/');
  });

  document.querySelector('a[data-content="mapoteca"]').addEventListener('click', function (event) {
    event.preventDefault();
    highlightMenuOption(this);
    loadContent('/mapoteca/');
  });

  loadContent('/inicio/', function () {
    highlightMenuOption(document.querySelector('a[data-content="Inicio"]'));
  });
});
