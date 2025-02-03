(function () {
    // Variables para mantener las instancias de los gráficos y evitar recreaciones innecesarias
    let deptoChartInstance;
    let funcionarioChartInstance;
    let tipoChartInstance;
    let tipoSolicitudChartInstance; // Nueva instancia para tipo de solicitud
    // let anioChartInstance;
    // let mesChartInstance; // Eliminado

    /**
     * Crea y muestra los gráficos estadísticos basados en los datos proporcionados.
     */
    function createCharts() {
        // Obtener los datos estadísticos desde los elementos del DOM
        const solicitudesPorDepto = JSON.parse(document.getElementById('solicitudesPorDepto').innerText);
        const solicitudesPorFuncionario = JSON.parse(document.getElementById('solicitudesPorFuncionario').innerText);
        const solicitudesPorTipoRecepcion = JSON.parse(document.getElementById('solicitudesPorTipo').innerText);
        const solicitudesPorTipoSolicitud = JSON.parse(document.getElementById('solicitudesPorTipoSolicitud').innerText);
        // const solicitudesPorAnio = JSON.parse(document.getElementById('solicitudesPorAnio').innerText);
        // const solicitudesPorMes = JSON.parse(document.getElementById('solicitudesPorMes').innerText); // Eliminado

        // Gráfico de barras horizontales para Solicitudes por Departamento
        const deptoCtx = document.getElementById('deptoChart').getContext('2d');
        if (deptoChartInstance) {
            deptoChartInstance.destroy();
        }
        deptoChartInstance = new Chart(deptoCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(solicitudesPorDepto),
                datasets: [{
                    label: 'Solicitudes por Departamento',
                    data: Object.values(solicitudesPorDepto),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'x', // Barras horizontales
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de barras para Solicitudes por Funcionario
        const funcionarioCtx = document.getElementById('funcionarioChart').getContext('2d');
        if (funcionarioChartInstance) {
            funcionarioChartInstance.destroy();
        }
        funcionarioChartInstance = new Chart(funcionarioCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(solicitudesPorFuncionario),
                datasets: [{
                    label: 'Solicitudes por Funcionario',
                    data: Object.values(solicitudesPorFuncionario),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Esto hará que las barras se muestren de forma horizontal

                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de barras para Solicitudes por Tipo de Recepción
        const tipoCtx = document.getElementById('tipoChart').getContext('2d');
        if (tipoChartInstance) {
            tipoChartInstance.destroy();
        }
        tipoChartInstance = new Chart(tipoCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(solicitudesPorTipoRecepcion),
                datasets: [{
                    label: 'Solicitudes por Tipo de Recepción',
                    data: Object.values(solicitudesPorTipoRecepcion),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de barras para Solicitudes por Tipo de Solicitud (Nuevo Gráfico en barras horizontales)
        const tipoSolicitudCtx = document.getElementById('tipoSolicitudChart').getContext('2d');
        const solicitudesPorTipoSolicitudData = solicitudesPorTipoSolicitud;
        if (tipoSolicitudChartInstance) {
            tipoSolicitudChartInstance.destroy();
        }
        tipoSolicitudChartInstance = new Chart(tipoSolicitudCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(solicitudesPorTipoSolicitudData),
                datasets: [{
                    label: 'Solicitudes por Tipo de Solicitud',
                    data: Object.values(solicitudesPorTipoSolicitudData),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)', // Puedes ajustar el color según tu preferencia
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Esto hará que las barras se muestren de forma horizontal
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });


        // Gráfico de líneas para Solicitudes por Año
        // const anioCtx = document.getElementById('anioChart').getContext('2d');
        // if (anioChartInstance) {
        //     anioChartInstance.destroy();
        // }
        // anioChartInstance = new Chart(anioCtx, {
        //     type: 'line',
        //     data: {
        //         labels: Object.keys(solicitudesPorAnio),
        //         datasets: [{
        //             label: 'Solicitudes por Año',
        //             data: Object.values(solicitudesPorAnio),
        //             fill: false,
        //             borderColor: 'rgba(255, 206, 86, 1)',
        //             tension: 0.1
        //         }]
        //     },
        //     options: {
        //         scales: {
        //             y: {
        //                 beginAtZero: true
        //             }
        //         }
        //     }
        // });
    }

    // Exponer la función createCharts al ámbito global
    window.createCharts = createCharts;

})();
