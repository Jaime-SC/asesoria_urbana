// Función para ordenar la tabla según una columna específica
function sortTable(table, column, type, ascending) {
    // Obtener el cuerpo de la tabla y todas las filas
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Función para comparar las filas basadas en el tipo de datos (número, fecha, texto)
    const compareFunction = (rowA, rowB) => {
        const cellA = rowA.cells[column].innerText.trim(); // Obtener el valor de la celda de la fila A
        const cellB = rowB.cells[column].innerText.trim(); // Obtener el valor de la celda de la fila B

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
    updatePaginationAfterSort(table, column);
}

// Función para actualizar la paginación después de ordenar la tabla
function updatePaginationAfterSort(table, column) {
    const paginationId = table.id === 'tablaSolicitudesMemo' ? 'paginationMemo' : 'paginationCorreo';
    const rowsPerPage = 5; // Número de filas por página
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

    // Función para configurar los botones de paginación
    function setupPagination() {
        const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
        pagination.innerHTML = ''; // Limpiar la paginación existente

        // Botón para ir a la página anterior
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<span class="material-symbols-outlined">arrow_back_2</span>';
        prevButton.className = 'page-btn prev';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                displayRows(currentPage);
                updatePaginationButtons();
            }
        });
        pagination.appendChild(prevButton);

        // Crear botones para cada página
        for (let i = 1; i <= pageCount; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = 'page-btn';
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', function () {
                currentPage = i;
                displayRows(currentPage);
                updatePaginationButtons();
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
                updatePaginationButtons();
            }
        });
        pagination.appendChild(nextButton);
    }

    // Función para actualizar el estado de los botones de paginación
    function updatePaginationButtons() {
        const pageButtons = pagination.querySelectorAll('.page-btn');
        pageButtons.forEach(btn => btn.classList.remove('active', 'highlight'));
        if (pageButtons[currentPage]) {
            pageButtons[currentPage].classList.add('active');
        }
        pagination.querySelector('.prev').disabled = currentPage === 1;
        pagination.querySelector('.next').disabled = currentPage === Math.ceil(filteredRows.length / rowsPerPage);
    }

    // Función para actualizar la paginación después de una búsqueda
    function updatePaginationAfterSearch() {
        currentPage = 1; // Resetear a la primera página después de la búsqueda
        setupPagination();
        displayRows(currentPage);
    }

    // Función para buscar en la tabla
    function searchTable(searchInputId) {
        const input = document.getElementById(searchInputId);
        if (!input) return;

        input.addEventListener('input', function () {
            const filter = input.value.toLowerCase();

            // Realizar búsqueda en todas las filas
            filteredRows = rows.filter(row => {
                const cells = Array.from(row.getElementsByTagName('td'));
                return cells.some(cell => cell.innerText.toLowerCase().includes(filter));
            });

            updatePaginationAfterSearch();
        });
    }

    // Inicializar la búsqueda en la tabla
    searchTable(tableId === 'tablaSolicitudesMemo' ? 'searchMemo' : 'searchCorreo');
    displayRows(currentPage);
    setupPagination();
}

function openDescripcionModal(descripcion) {
    const modal = document.getElementById('descripcionModal');
    const descripcionCompleta = document.getElementById('descripcionCompleta');

    descripcionCompleta.textContent = descripcion;
    modal.style.display = 'block';
}

function closeDescripcionModal() {
    const modal = document.getElementById('descripcionModal');
    modal.style.display = 'none';
}

// Cerrar el modal si se hace clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('descripcionModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Asegúrate de cargar estas funciones en la inicialización de tu página
document.addEventListener('DOMContentLoaded', function () {
    // Aquí asegúrate de que se cargue todo lo necesario para las tablas
    attachSortHandlers('tablaSolicitudesMemo');
    attachSortHandlers('tablaSolicitudesCorreo');
    paginateTable('tablaSolicitudesMemo', 'paginationMemo', 5);
    paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 5);

    // Incluir las funciones de manejo del modal de descripción
    window.openDescripcionModal = function (descripcion) {
        const modal = document.getElementById('descripcionModal');
        const descripcionCompleta = document.getElementById('descripcionCompleta');

        descripcionCompleta.textContent = descripcion;
        modal.style.display = 'block';
    };

    window.closeDescripcionModal = function () {
        const modal = document.getElementById('descripcionModal');
        modal.style.display = 'none';
    };

    // Cerrar el modal si se hace clic fuera de él
    window.onclick = function (event) {
        const modal = document.getElementById('descripcionModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});
