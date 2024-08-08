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

document.addEventListener('DOMContentLoaded', function () {
    attachSortHandlers('tablaSolicitudesMemo');
    attachSortHandlers('tablaSolicitudesCorreo');
});
