// statisticsChart.js

(function () {
    // Variables para mantener las instancias de los gráficos
    let deptoChartInstance;
    let funcionarioChartInstance;
    let tipoChartInstance;
    let anioChartInstance;
    let mesChartInstance;
    let diaSemanaChartInstance;

    // Crea gráficos basados en los datos de las estadísticas
    function createCharts() {
        // Obtiene los datos desde los elementos de texto de la página
        const solicitudesPorDepto = JSON.parse(document.getElementById('solicitudesPorDepto').innerText);
        const solicitudesPorFuncionario = JSON.parse(document.getElementById('solicitudesPorFuncionario').innerText);
        const solicitudesPorTipo = JSON.parse(document.getElementById('solicitudesPorTipo').innerText);
        const solicitudesPorAnio = JSON.parse(document.getElementById('solicitudesPorAnio').innerText);
        const solicitudesPorMes = JSON.parse(document.getElementById('solicitudesPorMes').innerText);
        const solicitudesPorDiaSemana = JSON.parse(document.getElementById('solicitudesPorDiaSemana').innerText);

        // Gráfico de barras para solicitudes por departamento
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
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Las barras serán horizontales
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Repite el mismo proceso para los otros gráficos

        // Gráfico de barras para solicitudes por funcionario
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
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'x',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Gráfico de barras para solicitudes por tipo de recepción
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
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
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

        // Gráfico de líneas para solicitudes por año
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

        // Gráfico de barras para solicitudes por mes
        const mesCtx = document.getElementById('mesChart').getContext('2d');

        // Lista de nombres de los meses en español
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Convertir los números de mes a sus nombres correspondientes
        const etiquetasMeses = Object.keys(solicitudesPorMes).map(numeroMes => nombresMeses[parseInt(numeroMes) - 1]);

        if (mesChartInstance) {
            mesChartInstance.destroy();
        }

        mesChartInstance = new Chart(mesCtx, {
            type: 'bar',
            data: {
                labels: etiquetasMeses,  // Usar nombres de los meses en lugar de números
                datasets: [{
                    label: 'Solicitudes por Mes',
                    data: Object.values(solicitudesPorMes),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });


        // Gráfico de barras para solicitudes por día de la semana
        const diaSemanaCtx = document.getElementById('diaSemanaChart').getContext('2d');
        if (diaSemanaChartInstance) {
            diaSemanaChartInstance.destroy();
        }
        diaSemanaChartInstance = new Chart(diaSemanaCtx, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                datasets: [{
                    label: 'Solicitudes por Día de la Semana',
                    data: Object.values(solicitudesPorDiaSemana),
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
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
