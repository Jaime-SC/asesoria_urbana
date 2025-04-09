// static/js/report.js

(function () {
    function initReport() {
        const exportBtn = document.getElementById('exportExcel');
        if (exportBtn) {
            exportBtn.addEventListener('click', function (e) {
                e.preventDefault(); // Evita el comportamiento por defecto
                console.log("Botón 'Generar Reporte' presionado.");
                fetch('/bnup/report/')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Error al obtener el reporte");
                        }
                        return response.text();
                    })
                    .then(html => {
                        console.log("Reporte obtenido, generando archivo Word...");
                        // Generamos el Word utilizando directamente el HTML obtenido
                        generateWordReport(html);
                    })
                    .catch(error => {
                        console.error('Error al generar el reporte:', error);
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo generar el reporte.'
                        });
                    });
            });
        } else {
            console.error("No se encontró el botón 'exportExcel'");
        }
    }

    // Ejecuta initReport inmediatamente si el documento ya está listo, o espera DOMContentLoaded
    if (document.readyState === "complete" || document.readyState === "interactive") {
        initReport();
    } else {
        document.addEventListener('DOMContentLoaded', initReport);
    }

    // Función para generar el archivo Word empaquetando el HTML en un Blob
    function generateWordReport(htmlContent) {
        const fullHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Estadísticas</title>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>`;
        const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "reporte_estadisticas.doc";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
})();
