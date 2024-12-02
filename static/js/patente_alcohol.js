// static/js/patente_alcohol.js

document.addEventListener('DOMContentLoaded', function () {
    initializePatenteAlcoholForm();
    initializePatenteAlcoholTable(); // Inicializar la tabla al cargar la página
});

function initializePatenteAlcoholForm() {
    const patenteForm = document.getElementById('patenteForm');

    // Estandarizar inputs
    initializeStandardizeInputs();

    patenteForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Obtener token CSRF
        const csrftoken = getCSRFToken();

        // Recolectar datos del formulario
        const formData = {
            'nombre': document.getElementById('nombre').value.trim(),
            'telefono': document.getElementById('telefono').value.trim(),
            'correo': document.getElementById('correo').value.trim(),
            'calle': document.getElementById('calle').value.trim(),
            'numero': document.getElementById('numero').value.trim(),
            'departamento': document.getElementById('departamento').value.trim(),
            'cerro_id': document.getElementById('cerro').value,
            'rol_avaluo': document.getElementById('rol_avaluo').value.trim(),
        };

        // Validar campos obligatorios
        if (!formData.nombre || !formData.calle || !formData.cerro_id || !formData.rol_avaluo) {
            Swal.fire({
                heightAuto: false,
                scrollbarPadding: false,
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, complete todos los campos obligatorios.',
            });
            return;
        }

        fetch('/patente_alcohol/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(formData),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'success',
                        title: 'Solicitud creada exitosamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    patenteForm.reset();

                    // Añadir la nueva solicitud a la tabla si el usuario está autenticado y la tabla existe
                    const table = document.getElementById('tablaSolicitudes');
                    if (data.solicitud && table) {
                        const tableBody = table.querySelector('tbody');
                        const newRow = document.createElement('tr');

                        newRow.innerHTML = `
                            <td>${escapeHtml(data.solicitud.numero_ingreso)}</td>
                            <td>${escapeHtml(data.solicitud.rol_avaluo)}</td>
                            <td>${escapeHtml(data.solicitud.fecha_ingreso)}</td>
                            <td>${escapeHtml(data.solicitud.solicitante)}</td>
                            <td>${escapeHtml(data.solicitud.cerro)}</td>
                            <td>
                                <button onclick="openDescripcionModal('${data.solicitud.id}')">Ver Detalles</button>
                            </td>
                        `;

                        tableBody.appendChild(newRow);

                        // Re-inicializar la tabla para que incluya la nueva fila
                        initializePatenteAlcoholTable(true);
                    }
                } else {
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error al crear la solicitud.',
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al enviar la solicitud.',
                });
            });
    });
}

function initializePatenteAlcoholTable(reload = false) {
    const table = document.getElementById('tablaSolicitudes');
    if (!table) {
        console.log('Tabla no encontrada.');
        return;
    }

    const paginationId = 'paginationSolicitudes';
    const searchInputId = 'searchSolicitudes';
    const rowsPerPage = getRowsPerPage();

    console.log('Inicializando tabla:', table.id);

    // Inicializar la tabla solo una vez
    if (!table.dataset.initialized || reload) {
        initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');
        table.classList.remove('hidden-table'); // Mostrar la tabla después de inicializarla
        table.dataset.initialized = true;
        console.log('Tabla inicializada.');
    }
}
