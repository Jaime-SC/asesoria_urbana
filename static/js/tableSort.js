// Función para ordenar la tabla según una columna específica
function sortTable(table, column, type, ascending) {
    // Obtener el cuerpo de la tabla y todas las filas
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Función para comparar las filas basadas en el tipo de datos (número, fecha, texto)
    const compareFunction = (rowA, rowB) => {
        // Obtener el valor de la celda de la fila A y B usando el atributo data-order si existe
        const cellA = rowA.cells[column].getAttribute('data-order') || rowA.cells[column].innerText.trim(); 
        const cellB = rowB.cells[column].getAttribute('data-order') || rowB.cells[column].innerText.trim(); 

        let a, b;
        switch (type) {
            case 'number':
                a = parseFloat(cellA) || 0; // Convertir a número
                b = parseFloat(cellB) || 0;
                break;
            case 'date':
                // Convertir la fecha al formato 'yyyy/mm/dd' para comparación
                a = cellA.split('/').reverse().join('');
                b = cellB.split('/').reverse().join('');
                break;
            default:
                a = cellA.toLowerCase(); // Convertir a minúsculas para comparación de texto
                b = cellB.toLowerCase();
                break;
        }

        // Retornar la comparación, ajustando para orden ascendente o descendente
        if (a < b) return ascending ? -1 : 1;
        if (a > b) return ascending ? 1 : -1;
        return 0;
    };

    // Ordenar las filas usando la función de comparación
    rows.sort(compareFunction);

    // Reinsertar las filas ordenadas en el cuerpo de la tabla
    rows.forEach(row => tbody.appendChild(row));

    // Después de ordenar, resetear la paginación para empezar desde la primera página
    updatePaginationAfterSort(table);
}

// Función para actualizar la paginación después de ordenar la tabla
function updatePaginationAfterSort(table) {
    const paginationId = table.getAttribute('data-pagination-id');
    const rowsPerPage = parseInt(table.getAttribute('data-rows-per-page')) || 8; // Número de filas por página
    paginateTable(table.id, paginationId, rowsPerPage); // Volver a paginar la tabla
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

// Función para manejar la paginación de la tabla
function paginateTable(tableId, paginationId, rowsPerPage) {
    const table = document.getElementById(tableId);
    const pagination = document.getElementById(paginationId);
    if (!table || !pagination) return; // Salir si la tabla o la paginación no se encuentran

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let currentPage = 1;
    let filteredRows = rows; // Iniciar con todas las filas visibles

    // Función para mostrar las filas de la página actual
    function displayRows(page) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        // Mostrar solo las filas filtradas
        rows.forEach(row => {
            row.style.display = 'none'; // Ocultar todas las filas inicialmente
        });

        filteredRows.slice(start, end).forEach(row => {
            row.style.display = ''; // Mostrar solo las filas de la página actual
        });
    }

    // Función para configurar los botones de paginación con carrusel
    function setupPagination() {
        const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
        pagination.innerHTML = ''; // Limpiar la paginación existente

        const maxVisiblePages = 3; // Máximo de botones de páginas visibles
        let startPage = Math.max(currentPage - 1, 1);
        let endPage = Math.min(startPage + maxVisiblePages - 1, pageCount);

        // Ajustar las páginas visibles si nos acercamos al final
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        // Botón para ir a la página anterior
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<span class="material-symbols-outlined">arrow_back_2</span>';
        prevButton.className = 'page-btn prev';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                displayRows(currentPage);
                setupPagination(); // Actualiza la paginación con las páginas visibles
            }
        });
        pagination.appendChild(prevButton);

        // Crear botones para las páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = 'page-btn';
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', function () {
                currentPage = i;
                displayRows(currentPage);
                setupPagination(); // Actualiza la paginación con las páginas visibles
            });
            pagination.appendChild(pageButton);
        }

        // Botón para ir a la página siguiente
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        nextButton.className = 'page-btn next';
        nextButton.disabled = currentPage === pageCount;
        nextButton.addEventListener('click', function () {
            if (currentPage < pageCount) {
                currentPage++;
                displayRows(currentPage);
                setupPagination(); // Actualiza la paginación con las páginas visibles
            }
        });
        pagination.appendChild(nextButton);
    }

    // Función para actualizar la paginación después de una búsqueda
    function updatePaginationAfterSearch() {
        currentPage = 1; // Resetear a la primera página después de la búsqueda
        setupPagination();
        displayRows(currentPage);
    }

    // Función para manejar la búsqueda en la tabla
    function searchTable(searchInputId) {
        const input = document.getElementById(searchInputId);
        if (!input) return;

        input.addEventListener('input', function () {
            let filter = input.value.trim().toLowerCase(); // Eliminar los espacios en blanco al inicio y al final

            // Limpiar todas las filas resaltadas antes de realizar una nueva búsqueda
            rows.forEach(row => {
                row.classList.remove('highlight-row'); // Eliminar el resaltado de todas las filas
            });

            // Si el cuadro de búsqueda está vacío o contiene solo espacios, mostrar todas las filas y salir de la función
            if (filter === '') {
                filteredRows = rows; // Restaurar todas las filas si no hay filtro válido
                updatePaginationAfterSearch(); // Volver a mostrar todas las filas con paginación
                return;
            }

            // Realizar búsqueda en todas las filas
            filteredRows = rows.filter(row => {
                const cells = Array.from(row.getElementsByTagName('td'));
                const found = cells.some(cell => cell.innerText.toLowerCase().includes(filter));

                // Si se encuentra una coincidencia, agregar la clase de resaltado a la fila
                if (found) {
                    row.classList.add('highlight-row');
                }
                return found; // Mantener la fila si contiene la palabra buscada
            });

            updatePaginationAfterSearch(); // Actualizar la paginación después de la búsqueda
        });
    }

    // Obtener el ID del campo de búsqueda desde un atributo de datos
    const searchInputId = table.getAttribute('data-search-input-id');
    if (searchInputId) {
        searchTable(searchInputId);
    }

    // Inicializar la búsqueda en la tabla unificada
    searchTable('searchSolicitudes'); // Asocia el campo de búsqueda a la tabla unificada
    displayRows(currentPage); // Mostrar las filas correspondientes a la página actual
    setupPagination(); // Configurar la paginación para la tabla unificada
}

// Función para inicializar las tablas
function initializeTable(tableId, paginationId, rowsPerPage, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Establecer atributos de datos en la tabla
    table.setAttribute('data-pagination-id', paginationId);
    table.setAttribute('data-rows-per-page', rowsPerPage);
    if (searchInputId) {
        table.setAttribute('data-search-input-id', searchInputId);
    }

    // Adjuntar controladores de ordenación y paginación
    attachSortHandlers(tableId);
    paginateTable(tableId, paginationId, rowsPerPage);
}

// Función para determinar las filas por página según el ancho de la pantalla
function getRowsPerPage() {
    if (window.matchMedia("(min-width: 1280px) and (max-width: 1366px)").matches) {
        return 7; // Si el ancho está entre 960px y 1358px
    } else if (window.matchMedia("(min-width: 1367px) and (max-width: 1920px)").matches) {
        return 10; // Si el ancho está entre 1359px y 1912px
    } else {
        return 10; // Valor por defecto para otros tamaños
    }
}

// En tableSort.js o en un archivo JS común

// Función para re-inicializar la tabla al cambiar el tamaño de la ventana
function handleResize() {
    const rowsPerPage = getRowsPerPage();
    initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');
}

// Agregar el listener al evento resize con un debounce para mejorar el rendimiento
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 500); // Ajusta el tiempo según tus necesidades
});



// Asegúrate de cargar estas funciones en la inicialización de tu página
document.addEventListener('DOMContentLoaded', function () {
    // Adjuntar controladores de ordenación y paginación a la nueva tabla unificada
    // initializeTable('tablaSolicitudes', 'paginationSolicitudes', 10, 'searchSolicitudes');
    // attachSortHandlers('tablaSolicitudes');
    // paginateTable('tablaSolicitudes', 'paginationSolicitudes', 10);
    const rowsPerPage = getRowsPerPage();
    initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');
    attachSortHandlers('tablaSolicitudes');
    paginateTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage);

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
