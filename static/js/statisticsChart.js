// Crea gráficos basados en los datos de las estadísticas
function createCharts() {
    // Obtiene los datos desde los elementos de texto de la página
    const solicitudesPorDepto = JSON.parse(document.getElementById('solicitudesPorDepto').innerText);
    const solicitudesPorFuncionario = JSON.parse(document.getElementById('solicitudesPorFuncionario').innerText);
    // const solicitudesPorFecha = JSON.parse(document.getElementById('solicitudesPorFecha').innerText);
    const solicitudesPorTipo = JSON.parse(document.getElementById('solicitudesPorTipo').innerText);
    // const promedioPorDepto = JSON.parse(document.getElementById('promedioPorDepto').innerText);
    const solicitudesPorAnio = JSON.parse(document.getElementById('solicitudesPorAnio').innerText);

    // Gráfico de barras para solicitudes por departamento
    const deptoCtx = document.getElementById('deptoChart').getContext('2d');
    new Chart(deptoCtx, {
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
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de barras horizontales para solicitudes por funcionario
    const funcionarioCtx = document.getElementById('funcionarioChart').getContext('2d');
    new Chart(funcionarioCtx, {
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
            indexAxis: 'y', // Las barras serán horizontales
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de línea para solicitudes a lo largo del tiempo
    // const fechaCtx = document.getElementById('fechaChart').getContext('2d');
    // new Chart(fechaCtx, {
    //     type: 'line',
    //     data: {
    //         labels: Object.keys(solicitudesPorFecha),
    //         datasets: [{
    //             label: 'Solicitudes a lo largo del tiempo',
    //             data: Object.values(solicitudesPorFecha),
    //             fill: false,
    //             borderColor: 'rgba(75, 192, 192, 1)',
    //             tension: 0.1
    //         }]
    //     },
    //     options: {
    //         scales: {
    //             x: {
    //                 type: 'time', // Tipo de escala de tiempo
    //                 time: {
    //                     unit: 'month' // Unidad de tiempo
    //                 }
    //             },
    //             y: {
    //                 beginAtZero: true
    //             }
    //         }
    //     }
    // });

    // Gráfico de barras para solicitudes por tipo de recepción
    const tipoCtx = document.getElementById('tipoChart').getContext('2d');
    new Chart(tipoCtx, {
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

    // Gráfico de barras para el promedio de número de ingreso por departamento
    // const promedioCtx = document.getElementById('promedioChart').getContext('2d');
    // new Chart(promedioCtx, {
    //     type: 'bar',
    //     data: {
    //         labels: Object.keys(promedioPorDepto),
    //         datasets: [{
    //             label: 'Promedio N° de Ingreso por Departamento',
    //             data: Object.values(promedioPorDepto),
    //             backgroundColor: 'rgba(75, 192, 192, 0.2)',
    //             borderColor: 'rgba(75, 192, 192, 1)',
    //             borderWidth: 1
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

    // Gráfico de líneas para solicitudes por año
    const anioCtx = document.getElementById('anioChart').getContext('2d');
    new Chart(anioCtx, {
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


    // Solicitudes por mes
    const solicitudesPorMes = JSON.parse(document.getElementById('solicitudesPorMes').innerText);
    const mesCtx = document.getElementById('mesChart').getContext('2d');
    new Chart(mesCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(solicitudesPorMes),
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

    // Solicitudes por día de la semana
    const solicitudesPorDiaSemana = JSON.parse(document.getElementById('solicitudesPorDiaSemana').innerText);
    const diaSemanaCtx = document.getElementById('diaSemanaChart').getContext('2d');
    new Chart(diaSemanaCtx, {
        type: 'bar',
        data: {
            labels: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
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

    // Solicitudes por Año y Mes
    // const solicitudesPorAnioMes = JSON.parse(document.getElementById('solicitudesPorAnioMes').innerText);
    // const anioMesCtx = document.getElementById('anioMesChart').getContext('2d');
    // new Chart(anioMesCtx, {
    //     type: 'line',
    //     data: {
    //         labels: Object.keys(solicitudesPorAnioMes),
    //         datasets: [{
    //             label: 'Solicitudes por Año y Mes',
    //             data: Object.values(solicitudesPorAnioMes),
    //             fill: false,
    //             borderColor: 'rgba(255, 206, 86, 1)',
    //             tension: 0.1
    //         }]
    //     },
    //     options: {
    //         scales: {
    //             x: {
    //                 beginAtZero: true
    //             },
    //             y: {
    //                 beginAtZero: true
    //             }
    //         }
    //     }
    // });


}
