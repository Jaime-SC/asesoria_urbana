// Objeto para mantener el estado de cada tabla
const tableStates = {};

/**
 * Determina el número de filas por página según el ancho de la pantalla.
 */
function getRowsPerPage() {
    if (window.matchMedia("(min-width: 1280px) and (max-width: 1366px)").matches) {
        return 7;
    } else {
        return 10;
    }
}

/**
 * Inicializa la tabla con funcionalidad de ordenamiento y paginación.
 * @param {string} tableId - El ID del elemento de la tabla.
 * @param {string} paginationId - El ID del contenedor de paginación.
 * @param {number} rowsPerPage - Número de filas a mostrar por página.
 * @param {string} [searchInputId] - El ID del elemento de entrada de búsqueda (opcional).
 */
function initializeTable(tableId, paginationId, rowsPerPage, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Reiniciar el estado de la tabla si ya existe
    if (tableStates[tableId]) {
        delete tableStates[tableId];
    }

    // Establecer atributos de datos en la tabla para referencia
    table.setAttribute('data-pagination-id', paginationId);
    table.setAttribute('data-rows-per-page', rowsPerPage);
    if (searchInputId) {
        table.setAttribute('data-search-input-id', searchInputId);
    }

    // Inicializar paginación y ordenamiento
    paginateTable(tableId, paginationId, rowsPerPage);
    attachSortHandlers(tableId);
}

/**
 * Adjunta controladores de eventos de clic a los encabezados de la tabla para la funcionalidad de ordenamiento.
 * @param {string} tableId - El ID del elemento de la tabla.
 */
function attachSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        let ascending = true; // Comenzar con orden ascendente
        header.addEventListener('click', function () {
            const type = header.getAttribute('data-type');

            // Eliminar indicadores de ordenamiento anteriores
            headers.forEach(h => h.classList.remove('ascending', 'descending'));

            // Ordenar la tabla y alternar la dirección
            sortTable(table, index, type, ascending);
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending; // Alternar dirección para el próximo clic
        });
    });
}

/**
 * Ordena la tabla basada en una columna específica.
 * @param {HTMLTableElement} table - El elemento de la tabla a ordenar.
 * @param {number} column - El índice de la columna por la cual ordenar.
 * @param {string} type - El tipo de dato de la columna ('number', 'date' o 'string').
 * @param {boolean} ascending - Orden de clasificación; true para ascendente, false para descendente.
 */
function sortTable(table, column, type, ascending) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    const tbody = table.tBodies[0];

    // Ordenar todas las filas basado en la columna y tipo especificados
    state.rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[column].getAttribute('data-order') || rowA.cells[column].innerText.trim();
        const cellB = rowB.cells[column].getAttribute('data-order') || rowB.cells[column].innerText.trim();

        let a, b;
        switch (type) {
            case 'number':
                a = parseFloat(cellA) || 0;
                b = parseFloat(cellB) || 0;
                break;
            case 'date':
                // Convertir fechas al formato 'yyyymmdd' para comparación adecuada
                a = cellA.split('/').reverse().join('');
                b = cellB.split('/').reverse().join('');
                break;
            default:
                a = cellA.toLowerCase();
                b = cellB.toLowerCase();
                break;
        }

        if (a < b) return ascending ? -1 : 1;
        if (a > b) return ascending ? 1 : -1;
        return 0;
    });

    // Actualizar filteredRows según el término de búsqueda actual
    if (state.searchTerm && state.searchTerm !== '') {
        state.filteredRows = state.rows.filter(row => {
            const cells = Array.from(row.getElementsByTagName('td'));
            return cells.some(cell => cell.innerText.toLowerCase().includes(state.searchTerm));
        });
    } else {
        state.filteredRows = [...state.rows];
    }

    // Reconstruir el cuerpo de la tabla con las filas ordenadas
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    state.rows.forEach(row => tbody.appendChild(row));

    // Actualizar paginación después del ordenamiento
    updatePaginationAfterSort(table);
}

/**
 * Actualiza la paginación y muestra la primera página después del ordenamiento.
 * @param {HTMLTableElement} table - El elemento de la tabla.
 */
function updatePaginationAfterSort(table) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

/**
 * Configura la paginación para la tabla.
 * @param {string} tableId - El ID del elemento de la tabla.
 * @param {string} paginationId - El ID del contenedor de paginación.
 * @param {number} rowsPerPage - Número de filas a mostrar por página.
 */
function paginateTable(tableId, paginationId, rowsPerPage) {
    const table = document.getElementById(tableId);
    const pagination = document.getElementById(paginationId);
    if (!table || !pagination) return;

    // Inicializar el estado de la tabla si no existe
    if (!tableStates[tableId]) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        tableStates[tableId] = {
            tableId: tableId,
            rows: rows,
            filteredRows: [...rows],
            currentPage: 1,
            rowsPerPage: rowsPerPage,
            paginationId: paginationId,
            searchInputId: table.getAttribute('data-search-input-id'),
            searchTerm: '',
        };
    }

    const state = tableStates[tableId];

    // Inicializar la funcionalidad de búsqueda si corresponde
    if (state.searchInputId) {
        searchTable(state);
    }

    // Mostrar filas iniciales y configurar controles de paginación
    displayRows(state, state.currentPage);
    setupPagination(state);
}

/**
 * Muestra las filas correspondientes a la página actual.
 * @param {Object} state - El objeto de estado de la tabla.
 * @param {number} page - El número de la página actual.
 */
function displayRows(state, page) {
    const start = (page - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;

    // Ocultar todas las filas
    state.rows.forEach(row => {
        row.style.display = 'none';
    });

    // Mostrar las filas de la página actual
    state.filteredRows.slice(start, end).forEach(row => {
        row.style.display = '';
    });
}

/**
 * Configura los controles de paginación.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function setupPagination(state) {
    const pageCount = Math.ceil(state.filteredRows.length / state.rowsPerPage);
    const pagination = document.getElementById(state.paginationId);
    pagination.innerHTML = ''; // Limpiar paginación existente

    const maxVisiblePages = 3; // Máximo de botones de páginas visibles
    let startPage = Math.max(state.currentPage - 1, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, pageCount);

    // Ajustar páginas visibles si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    // Botón para ir a la página anterior
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<span class="material-symbols-outlined">arrow_back_2</span>';
    prevButton.className = 'page-btn prev';
    prevButton.disabled = state.currentPage === 1;
    prevButton.addEventListener('click', function () {
        if (state.currentPage > 1) {
            state.currentPage--;
            displayRows(state, state.currentPage);
            setupPagination(state);
        }
    });
    pagination.appendChild(prevButton);

    // Botones para los números de página visibles
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'page-btn';
        if (i === state.currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', function () {
            state.currentPage = i;
            displayRows(state, state.currentPage);
            setupPagination(state);
        });
        pagination.appendChild(pageButton);
    }

    // Botón para ir a la página siguiente
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    nextButton.className = 'page-btn next';
    nextButton.disabled = state.currentPage === pageCount;
    nextButton.addEventListener('click', function () {
        if (state.currentPage < pageCount) {
            state.currentPage++;
            displayRows(state, state.currentPage);
            setupPagination(state);
        }
    });
    pagination.appendChild(nextButton);
}

/**
 * Inicializa la funcionalidad de búsqueda para la tabla.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function searchTable(state) {
    const input = document.getElementById(state.searchInputId);
    if (!input) return;

    input.addEventListener('input', function () {
        const filter = input.value.trim().toLowerCase();
        state.searchTerm = filter;

        // Eliminar resaltados anteriores
        state.rows.forEach(row => {
            row.classList.remove('highlight-row');
        });

        if (filter === '') {
            state.filteredRows = [...state.rows];
            updatePaginationAfterSearch(state);
            return;
        }

        // Filtrar filas basadas en el término de búsqueda
        state.filteredRows = state.rows.filter(row => {
            const cells = Array.from(row.getElementsByTagName('td'));
            const found = cells.some(cell => cell.innerText.toLowerCase().includes(filter));

            if (found) {
                row.classList.add('highlight-row');
            }

            return found;
        });

        updatePaginationAfterSearch(state);
    });
}

/**
 * Actualiza la paginación y muestra la primera página después de una búsqueda.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function updatePaginationAfterSearch(state) {
    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

/**
 * Re-inicializa la tabla cuando se cambia el tamaño de la ventana.
 */
function handleResize() {
    const rowsPerPage = getRowsPerPage();
    // Actualizar tablas existentes
    for (const tableId in tableStates) {
        const state = tableStates[tableId];
        state.rowsPerPage = rowsPerPage;
        state.currentPage = 1;
        setupPagination(state);
        displayRows(state, state.currentPage);
    }
}

// Añadir un listener con debounce al evento resize para mejorar el rendimiento
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 500);
});


/**
 * Inicializa las funcionalidades específicas cuando el DOM está completamente cargado.
 */
document.addEventListener('DOMContentLoaded', function () {
    const rowsPerPage = getRowsPerPage();
    initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');

    /**
     * Abre el modal de descripción con los datos proporcionados.
     * @param {string} descripcion - El texto de la descripción.
     * @param {string} nombre - El nombre del solicitante.
     * @param {string} fecha - La fecha de la solicitud.
     * @param {string} numero_ingreso - El número de ingreso.
     * @param {string} correo_solicitante - El correo del solicitante.
     * @param {string} departamento - El departamento del solicitante.
     * @param {string} funcionario_asignado - El funcionario asignado.
     * @param {string} tablaOrigen - El identificador de la tabla de origen.
     */
    window.openDescripcionModal = function (descripcion, nombre, fecha, numero_ingreso, correo_solicitante, departamento, funcionario_asignado, tablaOrigen) {
        const modal = document.getElementById('descripcionModal');
        const descripcionCompleta = document.getElementById('descripcionCompleta');
        const nombreCompleto = document.getElementById('nombreCompleto');
        const fechaIngreso = document.getElementById('fechaIngreso');
        const numeroIngresoSpan = document.getElementById('numero_ingreso');
        const correoSolicitante = document.getElementById('correo_solicitante');
        const deptoSolicitante = document.getElementById('deptoSolicitante');
        const funcionarioAsignado = document.getElementById('funcionario_asignado');
        const correoField = document.getElementById('correoField');

        // Rellenar los campos del modal con los datos proporcionados
        descripcionCompleta.textContent = descripcion;
        nombreCompleto.textContent = nombre;
        fechaIngreso.textContent = fecha;
        numeroIngresoSpan.textContent = numero_ingreso;
        deptoSolicitante.textContent = departamento;
        funcionarioAsignado.textContent = funcionario_asignado;

        // Mostrar u ocultar el campo de correo según la tabla de origen
        if (tablaOrigen === 'tablaSolicitudesCorreo') {
            correoSolicitante.textContent = correo_solicitante;
            correoField.style.display = 'flex';
        } else {
            correoField.style.display = 'none';
        }

        modal.style.display = 'block';
    };

    /**
     * Cierra el modal de descripción.
     */
    window.closeDescripcionModal = function () {
        const modal = document.getElementById('descripcionModal');
        modal.style.display = 'none';
    };

    // Cerrar el modal de descripción si se hace clic fuera de él
    document.addEventListener('click', function (event) {
        const modal = document.getElementById('descripcionModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});