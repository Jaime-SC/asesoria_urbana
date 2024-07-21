document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();

        // Agregar listener para el formulario
        document.getElementById('bnupForm').addEventListener('submit', function (event) {
            event.preventDefault();
            addRowToTable();
        });

        // Agregar listener para el buscador
        document.getElementById('searchInput').addEventListener('keyup', filterTable);

        // Inicializar la paginación
        setupPagination();
    }
});

function updateBNUPFields() {
    const memoRadio = document.getElementById('memo');
    const correoRadio = document.getElementById('correo');
    const numMemoField = document.getElementById('memoFields');
    const correoFields = document.getElementById('correoFields');
    const numMemoInput = document.getElementById('num_memo');
    const correoInput = document.getElementById('correoSolicitante');

    function updateFields() {
        if (memoRadio && correoRadio && numMemoField && correoFields && numMemoInput && correoInput) {
            memoRadio.addEventListener('change', function () {
                if (memoRadio.checked) {
                    numMemoField.style.display = 'block';
                    correoFields.style.display = 'none';
                    numMemoInput.required = true;
                    correoInput.required = false;
                }
            });

            correoRadio.addEventListener('change', function () {
                if (correoRadio.checked) {
                    numMemoField.style.display = 'none';
                    correoFields.style.display = 'block';
                    numMemoInput.required = false;
                    correoInput.required = true;
                }
            });

            // Inicializar el estado de los campos al cargar
            if (correoRadio.checked) {
                numMemoField.style.display = 'none';
                correoFields.style.display = 'block';
                numMemoInput.required = false;
                correoInput.required = true;
            } else if (memoRadio.checked) {
                numMemoField.style.display = 'block';
                correoFields.style.display = 'none';
                numMemoInput.required = true;
                correoInput.required = false;
            }
        } else {
            console.error('No se encontraron todos los elementos necesarios para updateFields.');
        }
    }

    updateFields();
}

function addRowToTable() {
    const recepcion = document.querySelector('input[name="recepcion"]:checked').value;
    const numMemoCorreo = recepcion === 'memo' ? document.getElementById('num_memo').value : document.getElementById('correoSolicitante').value;
    const deptoSolicitante = document.getElementById('depto_solicitante').value;
    const nombreSolicitante = document.getElementById('nombreSolicitante').value;
    const numeroIngreso = document.getElementById('numeroIngreso').value;
    const fecha = document.getElementById('fecha').value;
    const funcionarioAsignado = document.getElementById('funcionarioAsignado').value;
    const descripcion = document.getElementById('descripcion').value;

    const table = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    newRow.insertCell(0).textContent = recepcion;
    newRow.insertCell(1).textContent = numMemoCorreo;
    newRow.insertCell(2).textContent = deptoSolicitante;
    newRow.insertCell(3).textContent = nombreSolicitante;
    newRow.insertCell(4).textContent = numeroIngreso;
    newRow.insertCell(5).textContent = fecha;
    newRow.insertCell(6).textContent = funcionarioAsignado;
    newRow.insertCell(7).textContent = descripcion;

    // Clear the form
    document.getElementById('bnupForm').reset();

    // Update pagination after adding the row
    setupPagination();
}

function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toUpperCase();
    const table = document.getElementById('dataTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        tr[i].style.display = 'none';
        const td = tr[i].getElementsByTagName('td');
        for (let j = 0; j < td.length; j++) {
            if (td[j]) {
                if (td[j].textContent.toUpperCase().indexOf(searchInput) > -1) {
                    tr[i].style.display = '';
                    break;
                }
            }
        }
    }
}

function sortTable(n) {
    const table = document.getElementById('dataTable');
    let rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    switching = true;
    dir = 'asc';

    while (switching) {
        switching = false;
        rows = table.rows;

        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName('td')[n];
            y = rows[i + 1].getElementsByTagName('td')[n];

            if (dir == 'asc') {
                if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == 'desc') {
                if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        } else {
            if (switchcount == 0 && dir == 'asc') {
                dir = 'desc';
                switching = true;
            }
        }
    }
}

function setupPagination() {
    const table = document.getElementById('dataTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const pagination = document.getElementById('pagination');
    const rowsPerPage = 5;
    let currentPage = 1;
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    function displayRows(page) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        for (let i = 0; i < rows.length; i++) {
            rows[i].style.display = i >= start && i < end ? '' : 'none';
        }
    }

    function updatePagination() {
        pagination.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.className = i === currentPage ? 'active' : '';

            pageLink.addEventListener('click', function (e) {
                e.preventDefault();
                currentPage = i;
                displayRows(currentPage);
                updatePagination();
            });

            pagination.appendChild(pageLink);
        }
    }

    displayRows(currentPage);
    updatePagination();
}





