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
                                <button class="buttonLogin buttonPreview" onclick="openPatenteAlcoholDescripcionModal('${data.solicitud.id}')">
                                    <span class="material-symbols-outlined bell" style="color: ghostwhite;">preview</span>
                                    <span style="color: ghostwhite;">Ver Detalles</span>
                                </button>
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
    const rowsPerPage = 10; // Límite de 10 registros por página

    console.log('Inicializando tabla:', table.id);

    // Inicializar la tabla solo una vez o recargarla
    if (!table.dataset.initialized || reload) {
        initializeTable('tablaSolicitudes', 'paginationSolicitudes', rowsPerPage, 'searchSolicitudes');
        table.classList.remove('hidden-table'); // Mostrar la tabla después de inicializarla
        table.dataset.initialized = true;
        console.log('Tabla inicializada con 10 registros por página.');
    }
}

/**
 * Función para abrir el modal y mostrar los detalles de la solicitud.
 * @param {number} solicitudId - ID de la solicitud a mostrar.
 */
function openPatenteAlcoholDescripcionModal(solicitudId) {
    // Obtener el modal
    const modal = document.getElementById('descripcionModal');
    const spanClose = modal.querySelector('.close');

    // Limpiar contenido previo
    document.getElementById('modalNumeroIngreso').textContent = '';
    document.getElementById('modalRolAvaluo').textContent = '';
    document.getElementById('modalFechaIngreso').textContent = '';
    document.getElementById('modalSolicitante').textContent = '';
    document.getElementById('modalTelefono').textContent = '';
    document.getElementById('modalCorreo').textContent = '';
    document.getElementById('modalCalle').textContent = '';
    document.getElementById('modalNumero').textContent = '';
    document.getElementById('modalDepartamento').textContent = '';
    document.getElementById('modalCerro').textContent = '';

    // Hacer una petición AJAX para obtener los detalles
    fetch(`/patente_alcohol/detail/${solicitudId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const solicitud = data.data;
                document.getElementById('modalNumeroIngreso').textContent = solicitud.numero_ingreso;
                document.getElementById('modalRolAvaluo').textContent = solicitud.rol_avaluo;
                document.getElementById('modalFechaIngreso').textContent = solicitud.fecha_ingreso;
                document.getElementById('modalSolicitante').textContent = solicitud.solicitante;
                document.getElementById('modalTelefono').textContent = solicitud.telefono;
                document.getElementById('modalCorreo').textContent = solicitud.correo;
                document.getElementById('modalCalle').textContent = solicitud.calle;
                document.getElementById('modalNumero').textContent = solicitud.numero;
                document.getElementById('modalDepartamento').textContent = solicitud.departamento;
                document.getElementById('modalCerro').textContent = solicitud.cerro;

                // Mostrar el modal
                modal.style.display = 'block';
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'No se pudo obtener los detalles de la solicitud.',
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
                text: 'Error al obtener los detalles de la solicitud.',
            });
        });

    // Cuando el usuario hace clic en <span> (x), cierra el modal
    spanClose.onclick = function () {
        modal.style.display = 'none';
    }

    // Cuando el usuario hace clic fuera del modal, lo cierra
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

/**
 * Función para escapar caracteres HTML y prevenir inyecciones.
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
