(function () {
    // Almacena las instancias de los gráficos para evitar recreaciones innecesarias
    let chartInstances = {};

    // Agregar método para obtener la semana ISO a partir de una fecha
    Date.prototype.getISOWeek = function() {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Ajuste para que el jueves determine la semana ISO
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        var week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    // Función para transformar un número de semana en etiqueta "Mes - Semana"
    function getLabelForWeek(weekNumber, year) {
        // Obtén el primer jueves del año para calcular la semana ISO
        var simple = new Date(year, 0, 1);
        var dayOfWeek = simple.getDay();
        var diff = (dayOfWeek <= 4) ? (1 - dayOfWeek) : (8 - dayOfWeek);
        simple.setDate(simple.getDate() + diff);
        // Calcular el inicio de la semana dada
        var weekStart = new Date(simple);
        weekStart.setDate(simple.getDate() + (weekNumber - 1) * 7);
        var monthName = weekStart.toLocaleString('default', { month: 'long' });
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        // Calcular la semana en el mes
        var firstDayOfMonth = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
        var firstWeek = firstDayOfMonth.getISOWeek();
        var weekInMonth = weekNumber - firstWeek + 1;
        return monthName + " - " + weekInMonth;
    }

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

        // Detectar si la pantalla es '1366 x 607' y aplicar cambios a ciertos gráficos
        if (isSpecificScreenSize()) {
            switch (ctx.canvas.id) {
                case 'tipoSolicitudChart':
                    baseOptions.indexAxis = 'x';
                    baseOptions.scales.x.ticks.display = false;
                    break;
                case 'funcionarioChart':
                    baseOptions.indexAxis = 'x';
                    baseOptions.scales.x.ticks.display = false;
                    break;
                case 'salidasFuncionarioChart':
                    baseOptions.indexAxis = 'x';
                    baseOptions.scales.x.ticks.display = false;
                    break;
                case 'tipoChart':
                    baseOptions.indexAxis = 'x';
                    baseOptions.scales.x.ticks.display = false;
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

        // Para los gráficos de "Ingresos por Mes" y "Salidas Totales por Mes"
        // se transforman los números de mes en nombres de meses con la primera letra en mayúscula
        if (ctx.canvas.id === 'entradasMesChart' || ctx.canvas.id === 'salidasTotalesMesChart') {
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            labels = labels.map(label => {
                let num = parseInt(label);
                return monthNames[num - 1] || label;
            });
        }

        // Para gráficos por semana (Ingresos y Salidas por Semana), mostrar solo las últimas 12 semanas y transformar etiquetas
        if (ctx.canvas.id === 'entradasSemanaChart' || ctx.canvas.id === 'salidasSemanaChart') {
            const currentWeek = new Date().getISOWeek();
            let filteredLabels = [];
            let filteredData = [];
            for (let i = 0; i < labels.length; i++) {
                let weekNum = parseInt(labels[i]);
                if (weekNum >= currentWeek - 11 && weekNum <= currentWeek) {
                    filteredLabels.push(getLabelForWeek(weekNum, new Date().getFullYear()));
                    filteredData.push(data[i]);
                }
            }
            labels = filteredLabels;
            data = filteredData;
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
            { id: 'entradasSemanaChart', dataId: 'entradasPorSemana', label: 'Ingresos por Semana - Ultimos 3 Meses', color: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },
            { id: 'entradasMesChart', dataId: 'entradasPorMes', label: 'Ingresos Totales por Mes', color: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },
            { id: 'salidasFuncionarioChart', dataId: 'salidasPorFuncionario', label: 'Salidas por Funcionario', color: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)', axis: 'y' },
            { id: 'salidasSemanaActualChart', dataId: 'salidasSemanaActual', label: 'Salidas por Funcionario - Semana Actual', color: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)', axis: 'y' },
            { id: 'salidasMesActualChart', dataId: 'salidasMesActual', label: 'Salidas por Funcionario - Mes Actual', color: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)', axis: 'y' },
            { id: 'salidasSemanaChart', dataId: 'salidasPorSemana', label: 'Salidas por Semana - Ultimos 3 Meses', color: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },
            { id: 'salidasTotalesMesChart', dataId: 'salidasTotalesMes', label: 'Salidas Totales por Mes', color: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' },
            { id: 'entradasSemanaActualChart', dataId: 'entradasSemanaActual', label: 'Ingresos por Funcionario - Semana Actual', color: 'rgba(102, 204, 255, 0.6)', border: 'rgba(102, 204, 255, 1)', axis: 'y' },
            { id: 'entradasMesActualChart', dataId: 'entradasMesActual', label: 'Ingresos por Funcionario - Mes Actual', color: 'rgba(255, 205, 86, 0.6)', border: 'rgba(255, 205, 86, 1)', axis: 'y' },
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
