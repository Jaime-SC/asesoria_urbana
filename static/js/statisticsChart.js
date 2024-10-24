(function () {
    // Variables para mantener las instancias de los gráficos y evitar recreaciones innecesarias
    let deptoChartInstance;
    let funcionarioChartInstance;
    let tipoChartInstance;
    let anioChartInstance;
    let mesChartInstance;

    /**
     * Crea y muestra los gráficos estadísticos basados en los datos proporcionados.
     */
    function createCharts() {
        // Obtener los datos estadísticos desde los elementos del DOM
        const solicitudesPorDepto = JSON.parse(document.getElementById('solicitudesPorDepto').innerText);
        const solicitudesPorFuncionario = JSON.parse(document.getElementById('solicitudesPorFuncionario').innerText);
        const solicitudesPorTipo = JSON.parse(document.getElementById('solicitudesPorTipo').innerText);
        const solicitudesPorAnio = JSON.parse(document.getElementById('solicitudesPorAnio').innerText);
        const solicitudesPorMes = JSON.parse(document.getElementById('solicitudesPorMes').innerText);

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
                indexAxis: 'y', // Barras horizontales
                scales: {
                    x: {
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
                scales: {
                    y: {
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
                labels: Object.keys(solicitudesPorTipo),
                datasets: [{
                    label: 'Solicitudes por Tipo de Recepción',
                    data: Object.values(solicitudesPorTipo),
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

        // Gráfico de líneas para Solicitudes por Año
        const anioCtx = document.getElementById('anioChart').getContext('2d');
        if (anioChartInstance) {
            anioChartInstance.destroy();
        }
        anioChartInstance = new Chart(anioCtx, {
            type: 'line',
            data: {
                labels: Object.keys(solicitudesPorAnio),
                datasets: [{
                    label: 'Solicitudes por Año',
                    data: Object.values(solicitudesPorAnio),
                    fill: false,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    tension: 0.1
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

        // Gráfico de barras para Solicitudes por Mes
        const mesCtx = document.getElementById('mesChart').getContext('2d');
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        // Convertir números de mes a nombres de meses
        const etiquetasMeses = Object.keys(solicitudesPorMes).map(numeroMes => nombresMeses[parseInt(numeroMes) - 1]);

        if (mesChartInstance) {
            mesChartInstance.destroy();
        }
        mesChartInstance = new Chart(mesCtx, {
            type: 'bar',
            data: {
                labels: etiquetasMeses,
                datasets: [{
                    label: 'Solicitudes por Mes',
                    data: Object.values(solicitudesPorMes),
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
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
    }

    // Exponer la función createCharts al ámbito global
    window.createCharts = createCharts;

})();
