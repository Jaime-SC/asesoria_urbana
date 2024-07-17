document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('a[data-content="BNUP"]').addEventListener('click', function (event) {
    event.preventDefault() // Prevenir el comportamiento predeterminado

    fetch('/bnup/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data
      })
      .catch((error) => console.error('Error al cargar BNUP:', error))
  })

  document.querySelector('a[data-content="PatenteAlcohol"]').addEventListener('click', function (event) {
    event.preventDefault() // Prevenir el comportamiento predeterminado

    fetch('/patente_alcohol/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data
      })
      .catch((error) => console.error('Error al cargar Patente de Alcohol:', error))
  })

  document.querySelector('a[data-content="InformeTerreno"]').addEventListener('click', function (event) {
    event.preventDefault() // Prevenir el comportamiento predeterminado

    fetch('/informe_terreno/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data
      })
      .catch((error) => console.error('Error al cargar Informe de Terreno:', error))
  })

  document.querySelector('a[data-content="Inicio"]').addEventListener('click', function (event) {
    event.preventDefault() // Prevenir el comportamiento predeterminado

    fetch('/inicio/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data
      })
      .catch((error) => console.error('Error al cargar Inicio:', error))
  })

  document.querySelector('a[data-content="PortalTransparencia"]').addEventListener('click', function (event) {
    event.preventDefault() // Prevenir el comportamiento predeterminado

    fetch('/portal_transparencia/')
      .then((response) => response.text())
      .then((data) => {
        document.getElementById('contentMenu').innerHTML = data
      })
      .catch((error) => console.error('Error al cargar Portal de Transparencia:', error))
  })

  // Cargar el contenido de 'Inicio' al cargar la página
  fetch('/inicio/')
    .then((response) => response.text())
    .then((data) => {
      document.getElementById('contentMenu').innerHTML = data
    })
    .catch((error) => console.error('Error al cargar Inicio:', error))
})
