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
                indexAxis: 'x', // Esto hará que las barras se muestren de forma horizontal
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Array de nombres de meses (índice 0 = Enero, etc.)
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const entradasMesElem = document.getElementById('entradasPorMes');
        if (entradasMesElem) {
            const entradasPorMes = JSON.parse(entradasMesElem.innerText);
            // Convertir las claves numéricas a nombres de meses
            const mesesNumericos = Object.keys(entradasPorMes);
            const meses = mesesNumericos.map(m => monthNames[parseInt(m) - 1] || m);
            const dataMes = Object.values(entradasPorMes);
            const ctxEntradasMes = document.getElementById('entradasMesChart').getContext('2d');
            new Chart(ctxEntradasMes, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Entradas por Mes',
                        data: dataMes,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        const salidasMesElem = document.getElementById('salidasPorMes');
        if (salidasMesElem) {
            const salidasPorMes = JSON.parse(salidasMesElem.innerText);
            const mesesNumericos = Object.keys(salidasPorMes);
            const meses = mesesNumericos.map(m => monthNames[parseInt(m) - 1] || m);
            const dataMes = Object.values(salidasPorMes);
            const ctxSalidasMes = document.getElementById('salidasMesChart').getContext('2d');
            new Chart(ctxSalidasMes, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Salidas por Mes',
                        data: dataMes,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        const entradasSemanaElem = document.getElementById('entradasPorSemana');
        if (entradasSemanaElem) {
            const entradasPorSemana = JSON.parse(entradasSemanaElem.innerText);
            const semanasNumericos = Object.keys(entradasPorSemana);
            const semanas = semanasNumericos.map(w => "Semana " + w);
            const dataSemana = Object.values(entradasPorSemana);
            const ctxEntradasSemana = document.getElementById('entradasSemanaChart').getContext('2d');
            new Chart(ctxEntradasSemana, {
                type: 'bar',
                data: {
                    labels: semanas,
                    datasets: [{
                        label: 'Entradas por Semana',
                        data: dataSemana,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        const salidasSemanaElem = document.getElementById('salidasPorSemana');
        if (salidasSemanaElem) {
            const salidasPorSemana = JSON.parse(salidasSemanaElem.innerText);
            const semanasNumericos = Object.keys(salidasPorSemana);
            const semanas = semanasNumericos.map(w => "Semana " + w);
            const dataSemana = Object.values(salidasPorSemana);
            const ctxSalidasSemana = document.getElementById('salidasSemanaChart').getContext('2d');
            new Chart(ctxSalidasSemana, {
                type: 'bar',
                data: {
                    labels: semanas,
                    datasets: [{
                        label: 'Salidas por Semana',
                        data: dataSemana,
                        backgroundColor: 'rgba(255, 206, 86, 0.6)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        attachExportListener();


    }

    function exportStatisticsToExcel() {
        // Crear un nuevo libro de Excel
        var wb = XLSX.utils.book_new();

        // Helper: Convierte un objeto en un array de arrays con encabezado.
        function objectToArray(dataObj, header, mapKeys) {
            var data = [];
            data.push(header);
            for (var key in dataObj) {
                if (dataObj.hasOwnProperty(key)) {
                    var newKey = key;
                    if (mapKeys) {
                        var monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                        var monthIndex = parseInt(key);
                        if (!isNaN(monthIndex) && monthIndex >= 1 && monthIndex <= 12) {
                            newKey = monthNames[monthIndex - 1];
                        }
                    }
                    data.push([newKey, dataObj[key]]);
                }
            }
            return data;
        }

        // Lista de hojas a crear
        var sheets = [
            { id: "solicitudesPorDepto", sheetName: "Por Solicitante", header: ["Solicitante", "Solicitudes"] },
            { id: "solicitudesPorFuncionario", sheetName: "Por Solicitante", header: ["Funcionario", "Solicitudes"] },
            { id: "solicitudesPorTipo", sheetName: "Por Tipo Recepción", header: ["Tipo Recepción", "Solicitudes"] },
            { id: "solicitudesPorTipoSolicitud", sheetName: "Por Tipo Solicitud", header: ["Tipo Solicitud", "Solicitudes"] },
            { id: "entradasPorMes", sheetName: "Entradas por Mes", header: ["Mes", "Entradas"] },
            { id: "salidasPorMes", sheetName: "Salidas por Mes", header: ["Mes", "Salidas"] },
            { id: "entradasPorSemana", sheetName: "Entradas por Semana", header: ["Semana", "Entradas"] },
            { id: "salidasPorSemana", sheetName: "Salidas por Semana", header: ["Semana", "Salidas"] }
        ];

        sheets.forEach(function (sheetInfo) {
            var pElem = document.getElementById(sheetInfo.id);
            if (pElem) {
                try {
                    var dataObj = JSON.parse(pElem.innerText);
                    var mapKeys = (sheetInfo.id === "entradasPorMes" || sheetInfo.id === "salidasPorMes");
                    var dataArray = objectToArray(dataObj, sheetInfo.header, mapKeys);
                    var ws = XLSX.utils.aoa_to_sheet(dataArray);
                    XLSX.utils.book_append_sheet(wb, ws, sheetInfo.sheetName);
                } catch (e) {
                    console.error("Error procesando hoja " + sheetInfo.sheetName, e);
                }
            }
        });

        XLSX.writeFile(wb, "Estadisticas.xlsx");
    }

    function attachExportListener() {
        var exportBtn = document.getElementById("exportExcel");
        if (exportBtn) {
            exportBtn.addEventListener("click", exportStatisticsToExcel);
        } else {
            console.warn("No se encontró el botón exportExcel");
        }
    }

    // También mantenemos la función de paginación
    function initializeStatisticsPagination() {
        const pages = document.querySelectorAll('#statisticsPages .stats-page');
        const paginationContainer = document.getElementById('paginationStatistics');
        if (!pages.length || !paginationContainer) return;
        paginationContainer.innerHTML = '';
        pages.forEach((page, index) => {
            const btn = document.createElement('button');
            btn.textContent = index + 1;
            btn.className = 'page-btn';
            if (index === 0) btn.classList.add('active');
            btn.addEventListener('click', function () {
                pages.forEach(p => p.style.display = 'none');
                page.style.display = 'block';
                document.querySelectorAll('#paginationStatistics .page-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            paginationContainer.appendChild(btn);
        });
    }

    // Si la página se carga dinámicamente, asegúrate de llamar a createCharts() y initializeStatisticsPagination()
    // cuando el contenido de estadísticas ya esté en el DOM.

    window.createCharts = createCharts;
    window.initializeStatisticsPagination = initializeStatisticsPagination;
    window.exportStatisticsToExcel = exportStatisticsToExcel;

})();
