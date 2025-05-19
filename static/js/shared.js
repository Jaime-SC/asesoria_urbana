// shared.js

/**
 * Resalta o desresalta una fila de la tabla según si el checkbox está marcado.
 * @param {HTMLElement} row - Fila de la tabla.
 * @param {boolean} isChecked - Estado del checkbox.
 */
function toggleRowHighlight(row, isChecked) {
    if (isChecked) {
        row.classList.add('fila-marcada');
        row.classList.add('animate__headShake');
    } else {
        row.classList.remove('fila-marcada');
        row.classList.remove('animate__headShake');

    }
}

/**
 * Habilita o deshabilita botones de acción según las filas seleccionadas.
 * Debes asegurarte de que las variables `rowCheckboxes`, `deleteButton` y `editButton` estén definidas en el ámbito donde se use esta función.
 */
function updateActionButtonsState() {
    // Estas variables deben ser definidas en el ámbito global o pasar como parámetros
    const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
    const deleteButton = document.getElementById('deleteSelected');
    const editButton = document.getElementById('editSelected');

    const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
    const anyChecked = selectedCheckboxes.length > 0;

    if (deleteButton) {
        deleteButton.disabled = !anyChecked;
    }

    if (editButton) {
        editButton.disabled = !anyChecked;
    }
}

/**
 * Aplica estilos de borde redondeado a los encabezados de la tabla.
 */
function borde_thead() {
    const tableRow = document.querySelector('tr');

    if (tableRow) {
        const thElements = tableRow.querySelectorAll('th');

        if (thElements.length > 0) {
            thElements[0].style.borderRadius = '10px 0px 0px 0px';
            thElements[thElements.length - 1].style.borderRadius = '0px 10px 0px 0px';
        }
    }
}

/**
 * Obtiene el token CSRF necesario para las solicitudes POST.
 * @returns {string|null} - Token CSRF o null si no se encuentra.
 */
function getCSRFToken() {
    let cookieValue = null;
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(`${name}=`)) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Formatea una cadena de fecha al formato 'dd/mm/yyyy'.
 * @param {string} dateString - Fecha en formato ISO o similar.
 * @returns {string} - Fecha formateada o cadena vacía si es inválida.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const day = (`0${date.getDate()}`).slice(-2);
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Escapa caracteres especiales en una cadena para prevenir inyecciones de HTML.
 * @param {string} text - Texto a escapar.
 * @returns {string} - Texto escapado.
 */
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"'`=\/]/g, function (s) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return escape[s] || s;
    });
}

/**
 * Trunca una cadena de texto y añade '...' si excede la longitud máxima.
 * @param {string} text - Texto a truncar.
 * @param {number} maxLength - Longitud máxima permitida.
 * @returns {string} - Texto truncado o original si no excede.
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Determina el número de filas por página según el ancho de la pantalla.
 */
function getRowsPerPage() {
    if (window.matchMedia("(min-width: 1280px) and (max-width: 1366px)").matches) {
        return 7;
    } else {
        return 9;
    }
}

/**
 * Objeto para mantener el estado de cada tabla.
 * Mantener este objeto aquí para ser accesible por todas las funciones de tabla.
 */
const tableStates = {};

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

    // → NUEVO: calcular índice dinámico de la columna Funcionario
    const ths = table.querySelectorAll('thead th');
    const selectFilter = table.querySelector('thead select#funcionarioFilter');
    let funcColIdx = -1;
    if (selectFilter) {
        const funcTh = selectFilter.closest('th');
        funcColIdx = Array.prototype.indexOf.call(ths, funcTh);
        // añadir listener "change" al select como ya tenías...
        selectFilter.addEventListener('change', () => {
            const state = tableStates[tableId];
            const selected = selectFilter.value.toLowerCase();
            state.filteredRows = state.rows.filter(row => {
                const text = row.cells[funcColIdx].innerText.toLowerCase();
                return (!selected || text.includes(selected))
                    && (!state.searchTerm || row.innerText.toLowerCase().includes(state.searchTerm));
            });
            state.currentPage = 1;
            setupPagination(state);
            displayRows(state, state.currentPage);
        });
    }


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

    // -- NUEVO: filtro por funcionario --
    const filter = document.getElementById('funcionarioFilter');
    if (filter) {
        filter.addEventListener('change', () => {
            const state = tableStates[tableId];
            const selected = filter.value.toLowerCase();
            state.filteredRows = state.rows.filter(row => {
                // aquí ya usamos funcColIdx, no un 8 fijo
                const text = row.cells[funcColIdx].innerText.toLowerCase();
                const matchesFilter = !selected || text.includes(selected);
                const matchesSearch = !state.searchTerm || row.innerText.toLowerCase().includes(state.searchTerm);
                return matchesFilter && matchesSearch;
            });
            state.currentPage = 1;
            setupPagination(state);
            displayRows(state, state.currentPage);
        });
    }

    // Ordenar por defecto la columna 'Nº Ingreso' de mayor a menor
    const headers = table.querySelectorAll('thead th');
    let sortColumnIndex = -1;

    headers.forEach((header, index) => {
        if (header.textContent.trim() === 'Nº Ingreso') {
            sortColumnIndex = index;
        }
    });

    if (sortColumnIndex !== -1) {
        sortTable(table, sortColumnIndex, 'number', false); // false para descendente
        // Actualizar el indicador de ordenamiento en el encabezado
        headers[sortColumnIndex].classList.add('descending');
    }
}

/**
 * Adjunta controladores de eventos de clic a los encabezados de la tabla para la funcionalidad de ordenamiento.
 * @param {string} tableId - El ID del elemento de la tabla.
 */
function attachSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // 1) Todas las th en orden:
    const allTh = Array.from(table.querySelectorAll('thead th'));

    // 2) Solo las clicables
    const clickableTh = table.querySelectorAll('thead th:not(.non-clickable)');

    clickableTh.forEach(header => {
        let ascending = true;

        // Calculamos su índice real:
        const realIdx = allTh.indexOf(header);

        header.addEventListener('click', () => {
            const type = header.getAttribute('data-type');

            // Limpiar indicadores
            clickableTh.forEach(h => h.classList.remove('ascending', 'descending'));

            // Ordenar por la columna correcta
            sortTable(table, realIdx, type, ascending);

            // Marcar flecha
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending;
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
            let rowText = cells.map(cell => {
                const previewElem = cell.querySelector('.descripcion-preview');
                return previewElem
                    ? (previewElem.getAttribute('data-fulltext') || previewElem.innerText)
                    : cell.innerText;
            }).join(' ').toLowerCase();

            // Agregar el correo (data-email) y las salidas (data-salidas)
            const email = row.getAttribute('data-email') || '';
            const salidas = row.getAttribute('data-salidas') || '';
            rowText += " " + email.toLowerCase() + " " + salidas.toLowerCase();

            return rowText.includes(filter);
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
