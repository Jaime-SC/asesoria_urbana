// tableSort.js

// Objeto para mantener el estado de cada tabla
const tableStates = {};

// Función para determinar las filas por página según el ancho de la pantalla
function getRowsPerPage() {
    if (window.matchMedia("(min-width: 1280px) and (max-width: 1366px)").matches) {
        return 7; // Si el ancho está entre 1280px y 1366px
    } else if (window.matchMedia("(min-width: 1367px) and (max-width: 1920px)").matches) {
        return 10; // Si el ancho está entre 1367px y 1920px
    } else {
        return 10; // Valor por defecto para otros tamaños
    }
}

// Función para inicializar las tablas
function initializeTable(tableId, paginationId, rowsPerPage, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Reiniciar el estado de la tabla si ya existe
    if (tableStates[tableId]) {
        delete tableStates[tableId];
    }

    // Establecer atributos de datos en la tabla
    table.setAttribute('data-pagination-id', paginationId);
    table.setAttribute('data-rows-per-page', rowsPerPage);
    if (searchInputId) {
        table.setAttribute('data-search-input-id', searchInputId);
    }

    // Inicializar paginación y ordenación
    paginateTable(tableId, paginationId, rowsPerPage);
    attachSortHandlers(tableId);
}

// Función para adjuntar los controladores de eventos de ordenación a los encabezados de la tabla
function attachSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        let ascending = true; // Empezar con el orden ascendente
        header.addEventListener('click', function () {
            const type = header.getAttribute('data-type');

            // Limpiar los indicadores de ordenación anteriores
            headers.forEach(h => h.classList.remove('ascending', 'descending'));

            // Ordenar la tabla y alternar la dirección
            sortTable(table, index, type, ascending);
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending; // Alternar la dirección de ordenación para el siguiente clic
        });
    });
}

// Función para ordenar la tabla según una columna específica
function sortTable(table, column, type, ascending) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    const tbody = table.tBodies[0];

    // Ordenar todas las filas
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
                // Convertir fechas al formato 'yyyymmdd' para comparar correctamente
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
        state.filteredRows = [...state.rows]; // Clonar el array
    }

    // Reconstruir el cuerpo de la tabla
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    state.rows.forEach(row => tbody.appendChild(row));

    // Actualizar paginación
    updatePaginationAfterSort(table);
}

// Función para actualizar la paginación después de ordenar la tabla
function updatePaginationAfterSort(table) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

// Función para manejar la paginación de la tabla
function paginateTable(tableId, paginationId, rowsPerPage) {
    const table = document.getElementById(tableId);
    const pagination = document.getElementById(paginationId);
    if (!table || !pagination) return; // Salir si la tabla o la paginación no se encuentran

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

    // Inicializar búsqueda si corresponde
    if (state.searchInputId) {
        searchTable(state);
    }

    // Mostrar filas y configurar paginación
    displayRows(state, state.currentPage);
    setupPagination(state);
}

// Función para mostrar las filas de la página actual
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

// Función para configurar la paginación
function setupPagination(state) {
    const pageCount = Math.ceil(state.filteredRows.length / state.rowsPerPage);
    const pagination = document.getElementById(state.paginationId);
    pagination.innerHTML = ''; // Limpiar la paginación existente

    const maxVisiblePages = 3; // Máximo de botones de páginas visibles
    let startPage = Math.max(state.currentPage - 1, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, pageCount);

    // Ajustar las páginas visibles si nos acercamos al final
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
            setupPagination(state); // Actualiza la paginación con las páginas visibles
        }
    });
    pagination.appendChild(prevButton);

    // Crear botones para las páginas visibles
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
            setupPagination(state); // Actualiza la paginación con las páginas visibles
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
            setupPagination(state); // Actualiza la paginación con las páginas visibles
        }
    });
    pagination.appendChild(nextButton);
}

// Función para manejar la búsqueda en la tabla
function searchTable(state) {
    const input = document.getElementById(state.searchInputId);
    if (!input) return;

    input.addEventListener('input', function () {
        const filter = input.value.trim().toLowerCase();
        state.searchTerm = filter;

        // Limpiar resaltados
        state.rows.forEach(row => {
            row.classList.remove('highlight-row');
        });

        if (filter === '') {
            state.filteredRows = [...state.rows];
            updatePaginationAfterSearch(state);
            return;
        }

        // Filtrar las filas
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

// Función para actualizar la paginación después de una búsqueda
function updatePaginationAfterSearch(state) {
    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

// Función para re-inicializar la tabla al cambiar el tamaño de la ventana
function handleResize() {
    const rowsPerPage = getRowsPerPage();
    // Actualizar las tablas existentes
    for (const tableId in tableStates) {
        const state = tableStates[tableId];
        state.rowsPerPage = rowsPerPage;
        state.currentPage = 1;
        setupPagination(state);
        displayRows(state, state.currentPage);
    }
}

// Agregar el listener al evento resize con un debounce para mejorar el rendimiento
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 500); // Ajusta el tiempo según tus necesidades
});

// Inicializar las funcionalidades específicas cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    
    const rowsPerPage = getRowsPerPage();
    initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');

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

        descripcionCompleta.textContent = descripcion;
        nombreCompleto.textContent = nombre;
        fechaIngreso.textContent = fecha;
        numeroIngresoSpan.textContent = numero_ingreso;
        deptoSolicitante.textContent = departamento;
        funcionarioAsignado.textContent = funcionario_asignado;

        // Condicional para mostrar u ocultar el correo según la tabla de origen
        if (tablaOrigen === 'tablaSolicitudesCorreo') {
            correoSolicitante.textContent = correo_solicitante;
            correoField.style.display = 'flex';
        } else {
            correoField.style.display = 'none';
        }

        modal.style.display = 'block';
    };

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
