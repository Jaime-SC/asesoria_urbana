(function () {
    // Almacena las instancias de los gráficos para evitar recreaciones innecesarias
    let chartInstances = {};

    // Función para verificar si la pantalla está en el tamaño específico
    function isSpecificScreenSize() {
        return window.innerWidth === 1366 && window.innerHeight === 607;
    }

    // Función genérica para crear gráficos responsivos
    function createResponsiveChart(ctx, data, labels, labelText, bgColor, borderColor, axis = 'x', options = {}) {
        if (chartInstances[ctx.canvas.id]) {
            chartInstances[ctx.canvas.id].destroy();
        }

        // Opciones base para los gráficos
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: axis,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { display: true }
                },
                y: {
                    beginAtZero: true,
                    ticks: { display: true }
                }
            }
        };

        // Detectar si la pantalla es '1366 x 607' y aplicar cambios a los gráficos específicos
        if (isSpecificScreenSize()) {
            switch (ctx.canvas.id) {
                case 'tipoSolicitudChart':
                    baseOptions.scales.x.ticks.display = false; // Ocultar nombres de categorías
                    break;

                case 'funcionarioChart':
                    baseOptions.indexAxis = 'x';  // Barras en vertical
                    baseOptions.scales.x.ticks.display = false; // Ocultar nombres de categorías
                    break;

                case 'tipoChart':
                    baseOptions.indexAxis = 'x';  // Barras en vertical
                    baseOptions.scales.x.ticks.display = false; // Ocultar nombres de categorías
                    break;

                case 'deptoChart':
                    const combined = labels.map((label, index) => ({
                        label: label,
                        value: data[index]
                    }));
                    combined.sort((a, b) => b.value - a.value);
                    const top10 = combined.slice(0, 10);
                    labels = top10.map(item => item.label);
                    data = top10.map(item => item.value);
                    break;
            }
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelText,
                    data: data,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 1
                }]
            },
            options: { ...baseOptions, ...options }
        });

        // Redimensionar el canvas dinámicamente
        function resizeCanvas() {
            const container = ctx.canvas.parentElement;
            ctx.canvas.width = container.clientWidth;
            ctx.canvas.height = container.clientHeight;
            chart.resize();
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        chartInstances[ctx.canvas.id] = chart;
    }

    // Función para inicializar los gráficos
    function createCharts() {
        const chartData = [
            { id: 'deptoChart', dataId: 'solicitudesPorDepto', label: 'Ingresos por Solicitante', color: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)', axis: 'y' },
            { id: 'funcionarioChart', dataId: 'solicitudesPorFuncionario', label: 'Ingresos por Funcionario', color: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)', axis: 'y' },
            { id: 'tipoChart', dataId: 'solicitudesPorTipo', label: 'Ingresos por Tipo de Recepción', color: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)', axis: 'y' },
            { id: 'tipoSolicitudChart', dataId: 'solicitudesPorTipoSolicitud', label: 'Ingresos por Tipo de Solicitud', color: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)', axis: 'y' },
            { id: 'entradasSemanaChart', dataId: 'entradasPorSemana', label: 'Ingresos por Semana', color: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },
            { id: 'entradasMesChart', dataId: 'entradasPorMes', label: 'Ingresos por Mes', color: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },
            { id: 'salidasFuncionarioChart', dataId: 'salidasPorFuncionario', label: 'Salidas por Funcionario', color: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)', axis: 'y' },
            { id: 'salidasSemanaActualChart', dataId: 'salidasSemanaActual', label: 'Salidas por Funcionario - Semana Actual', color: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)', axis: 'y' },
            { id: 'salidasMesActualChart', dataId: 'salidasMesActual', label: 'Salidas por Funcionario - Mes Actual', color: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)', axis: 'y' },
            { id: 'salidasSemanaChart', dataId: 'salidasPorSemana', label: 'Salidas por Semana', color: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },
            { id: 'salidasTotalesMesChart', dataId: 'salidasTotalesMes', label: 'Salidas Totales por Mes', color: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' },
            { id: 'entradasSemanaActualChart', dataId: 'entradasSemanaActual', label: 'Entradas por Funcionario - Semana Actual', color: 'rgba(102, 204, 255, 0.6)', border: 'rgba(102, 204, 255, 1)', axis: 'y' },
            { id: 'entradasMesActualChart', dataId: 'entradasMesActual', label: 'Entradas por Funcionario - Mes Actual', color: 'rgba(255, 205, 86, 0.6)', border: 'rgba(255, 205, 86, 1)', axis: 'y' },

        ];

        chartData.forEach(chartInfo => {
            const dataElem = document.getElementById(chartInfo.dataId);
            if (dataElem) {
                const data = JSON.parse(dataElem.innerText);
                const ctx = document.getElementById(chartInfo.id).getContext('2d');
                createResponsiveChart(ctx, Object.values(data), Object.keys(data), chartInfo.label, chartInfo.color, chartInfo.border, chartInfo.axis);
            }
        });
    }

    // Paginación de estadísticas
    function initializeStatisticsPagination() {
        const pages = document.querySelectorAll('#statisticsPages .stats-page');
        const paginationContainer = document.getElementById('paginationStatistics');
        if (!pages.length || !paginationContainer) return;
        paginationContainer.innerHTML = '';

        // Botón "Anterior"
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<span class="material-symbols-outlined">arrow_back_2</span>';
        prevBtn.className = "page-btn prev";
        prevBtn.addEventListener('click', () => changePage(-1));
        paginationContainer.appendChild(prevBtn);

        // Crear botones para cada página
        pages.forEach((page, index) => {
            const btn = document.createElement('button');
            btn.textContent = index + 1;
            btn.className = 'page-btn page-num';
            if (index === 0) btn.classList.add('active');
            btn.addEventListener('click', () => showPage(index));
            paginationContainer.appendChild(btn);
        });

        // Botón "Siguiente"
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        nextBtn.className = "page-btn next";
        nextBtn.addEventListener('click', () => changePage(1));
        paginationContainer.appendChild(nextBtn);

        // Mostrar página inicial
        showPage(0);
    }

    function showPage(index) {
        const pages = document.querySelectorAll('#statisticsPages .stats-page');
        const pageButtons = document.querySelectorAll('.page-btn.page-num');
        pages.forEach(p => p.style.display = 'none');
        pages[index].style.display = 'block';

        pageButtons.forEach(btn => btn.classList.remove('active'));
        pageButtons[index].classList.add('active');
    }

    function changePage(direction) {
        const pages = document.querySelectorAll('#statisticsPages .stats-page');
        const pageButtons = Array.from(document.querySelectorAll('.page-btn.page-num'));
        const activeIndex = pageButtons.findIndex(btn => btn.classList.contains('active'));

        const newIndex = activeIndex + direction;
        if (newIndex >= 0 && newIndex < pages.length) {
            showPage(newIndex);
        }
    }

    // Inicialización de las estadísticas y paginación
    window.createCharts = createCharts;
    window.initializeStatisticsPagination = initializeStatisticsPagination;
})();
