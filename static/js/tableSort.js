function sortTable(table, column, type, ascending) {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const compareFunction = (rowA, rowB) => {
        const cellA = rowA.cells[column].innerText.trim();
        const cellB = rowB.cells[column].innerText.trim();

        let a, b;
        switch (type) {
            case 'number':
                a = parseFloat(cellA) || 0;
                b = parseFloat(cellB) || 0;
                break;
            case 'date':
                // Parse date in 'dd/mm/yyyy' format
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
    };

    rows.sort(compareFunction);

    rows.forEach(row => tbody.appendChild(row));

    // After sorting, reset the pagination to start from the first page
    updatePaginationAfterSort(table, column);
}

function updatePaginationAfterSort(table, column) {
    const paginationId = table.id === 'tablaSolicitudesMemo' ? 'paginationMemo' : 'paginationCorreo';
    const rowsPerPage = 5; // Set the number of rows per page
    paginateTable(table.id, paginationId, rowsPerPage);
}

function attachSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        let ascending = true; // Start with ascending order
        header.addEventListener('click', function () {
            const type = header.getAttribute('data-type');

            // Clear previous sort indicators
            headers.forEach(h => h.classList.remove('ascending', 'descending'));

            // Sort the table and toggle the direction
            sortTable(table, index, type, ascending);
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending; // Toggle the sort direction for next click
        });
    });
}

function paginateTable(tableId, paginationId, rowsPerPage) {
    const table = document.getElementById(tableId);
    const pagination = document.getElementById(paginationId);
    if (!table || !pagination) return; // Exit if table or pagination element is not found

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    let currentPage = 1;
    let filteredRows = rows; // Start with all rows visible

    function displayRows(page) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display = (filteredRows.includes(row) && index >= start && index < end) ? '' : 'none';
        });
    }

    function setupPagination() {
        const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
        pagination.innerHTML = ''; // Clear existing pagination

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

    function updatePaginationButtons() {
        const pageButtons = pagination.querySelectorAll('.page-btn');
        pageButtons.forEach(btn => btn.classList.remove('active', 'highlight'));
        if (pageButtons[currentPage]) {
            pageButtons[currentPage].classList.add('active');
        }
        pagination.querySelector('.prev').disabled = currentPage === 1;
        pagination.querySelector('.next').disabled = currentPage === Math.ceil(filteredRows.length / rowsPerPage);
    }

    function updatePaginationAfterSearch() {
        currentPage = 1; // Reset to the first page after search
        setupPagination();
        displayRows(currentPage);
    }

    function searchTable(searchInputId) {
        const input = document.getElementById(searchInputId);
        if (!input) return;

        input.addEventListener('input', function () {
            const filter = input.value.toLowerCase();
            filteredRows = rows.filter(row => {
                const cells = Array.from(row.getElementsByTagName('td'));
                return cells.some(cell => cell.innerText.toLowerCase().includes(filter));
            });

            updatePaginationAfterSearch();

            // Highlight the next button if there are more than one page of filtered results
            const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
            if (pageCount > 1) {
                pagination.querySelector('.next').classList.add('highlight');
            } else {
                pagination.querySelector('.next').classList.remove('highlight');
            }
        });
    }

    searchTable(tableId === 'tablaSolicitudesMemo' ? 'searchMemo' : 'searchCorreo');
    displayRows(currentPage);
    setupPagination();
}

document.addEventListener('DOMContentLoaded', function () {
    attachSortHandlers('tablaSolicitudesMemo');
    attachSortHandlers('tablaSolicitudesCorreo');

    paginateTable('tablaSolicitudesMemo', 'paginationMemo', 5);
    paginateTable('tablaSolicitudesCorreo', 'paginationCorreo', 5);
});
