// static/js/patente_alcohol.js

/**
 * Obtiene el token CSRF de las cookies.
 * @returns {string} - Token CSRF.
 */
function getCSRFToken() {
    let cookieValue = null;
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Verifica si esta cookie comienza con el nombre que buscamos
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Muestra un mensaje informativo indicando que se debe agregar un Número de Ingreso antes.
 */
function mostrarMensajeAgregarIngreso() {
    Swal.fire({
        heightAuto: false,
        scrollbarPadding: false,
        icon: 'info',
        title: 'Sin Nº de Ingreso',
        text: 'Debe agregar un Número de Ingreso antes de poder agregar un Número de Salida.',
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializePatenteAlcoholForm();
    initializePatenteAlcoholTable(); // Inicializar la tabla al cargar la página
});

/**
 * Inicializa el formulario de patente de alcohol.
 */
function initializePatenteAlcoholForm() {
    const patenteForm = document.getElementById('patenteForm');

    // Estandarizar inputs (función asumida existente)
    if (typeof initializeStandardizeInputs === 'function') {
        initializeStandardizeInputs();
    }

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
                        newRow.setAttribute('data-id', data.solicitud.id);

                        newRow.innerHTML = `
                            <td>
                                ${data.solicitud.numero_ingreso !== "Sin número" ? escapeHtml(data.solicitud.numero_ingreso) : `
                                    <button class="buttonLogin buttonAgregarIngreso" onclick="openAddNumeroIngresoModal('${data.solicitud.id}')">
                                        <span class="material-symbols-outlined">add_box</span>
                                        <span class="spanText">Nº Ingreso</span>
                                    </button>
                                `}
                            </td>
                            <td>${escapeHtml(data.solicitud.fecha_ingreso)}</td>
                            <td>${escapeHtml(data.solicitud.rol_avaluo)}</td>
                            <td>${escapeHtml(data.solicitud.cerro)}</td>
                            <td>${escapeHtml(data.solicitud.solicitante)}</td>
                            <td class="tdSalida">
                                ${data.solicitud.numero_ingreso !== "Sin número" ? `
                                    <button class="buttonLogin buttonAgregarSalida" onclick="openAgregarSalidaModal('${data.solicitud.id}')">
                                        <span class="material-symbols-outlined bell">add_box</span>
                                        <span class="spanText">Nº Salida</span>
                                    </button>
                                ` : `
                                    <button class="buttonLogin buttonAgregarSalida disabled-button" onclick="mostrarMensajeAgregarIngreso()">
                                        <span class="material-symbols-outlined bell">add_box</span>
                                        <span class="spanText">Nº Salida</span>
                                    </button>
                                `}
                            </td>
                            <td class="tdPreview">
                                <button class="buttonLogin buttonPreview" onclick="openPatenteAlcoholDescripcionModal('${data.solicitud.id}')">
                                    <span class="material-symbols-outlined bell">preview</span>
                                    <span class="spanText">Ver Ingreso</span>
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

/**
 * Inicializa la tabla de solicitudes con paginación y búsqueda.
 * @param {boolean} reload - Indica si se debe recargar la tabla.
 */
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
 * Abre el modal para agregar el Número de Ingreso.
 * @param {number} solicitudId - ID de la solicitud.
 */
function openAddNumeroIngresoModal(solicitudId) {
    const modal = document.getElementById('agregarNumeroIngresoModal');
    const form = document.getElementById('numeroIngresoForm');
    const solicitudIdInput = document.getElementById('numeroIngresoSolicitudId');

    // Establecer el ID de la solicitud en el campo oculto
    solicitudIdInput.value = solicitudId;

    // Resetear el formulario
    form.reset();

    // Mostrar el modal
    modal.style.display = 'block';

    // Manejar el cierre del modal al hacer clic en la 'x'
    const spanClose = modal.querySelector('.close');
    spanClose.onclick = function () {
        modal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
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

    // Manejar el cierre del modal al hacer clic en la 'x'
    spanClose.onclick = function () {
        modal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Abre el modal para registrar una salida.
 * @param {number} solicitudId - ID de la solicitud asociada.
 */
function openAgregarSalidaModal(solicitudId) {
    const modal = document.getElementById('agregarSalidaModal');
    const form = document.getElementById('salidaForm');
    const solicitudIdInput = document.getElementById('salidaSolicitudId');

    // Establecer el ID de la solicitud en el campo oculto
    solicitudIdInput.value = solicitudId;

    // Resetear el formulario
    form.reset();

    // Mostrar el modal
    modal.style.display = 'block';

    // Manejar el cierre del modal al hacer clic en la 'x'
    const spanClose = modal.querySelector('.close');
    spanClose.onclick = function () {
        modal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Abre el modal para ver la salida de una solicitud.
 * @param {number} solicitudId - ID de la solicitud.
 */
function openVerSalidaModal(solicitudId) {
    const modal = document.getElementById('verSalidaModal');
    const spanClose = modal.querySelector('.close');

    // Limpiar contenido previo
    document.getElementById('modalNumeroSalida').textContent = '';
    document.getElementById('modalFechaSalida').textContent = '';
    document.getElementById('modalDescripcionSalida').textContent = '';
    document.getElementById('modalArchivoSalida').href = '#';
    document.getElementById('modalArchivoSalida').textContent = 'Sin archivo';
    document.getElementById('pdfLink').href = '#'; // Resetear el enlace del PDF

    // Hacer una petición AJAX para obtener los detalles de la salida
    fetch(`/patente_alcohol/detail_salida/${solicitudId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const salida = data.data;
                document.getElementById('modalNumeroSalida').textContent = salida.numero_salida || 'Sin número';
                document.getElementById('modalFechaSalida').textContent = salida.fecha_salida;
                document.getElementById('modalDescripcionSalida').textContent = salida.descripcion || 'Sin descripción';

                if (salida.archivo_adjunto_salida_url) {
                    document.getElementById('modalArchivoSalida').href = salida.archivo_adjunto_salida_url;
                    document.getElementById('modalArchivoSalida').textContent = 'Ver Archivo';
                } else {
                    document.getElementById('modalArchivoSalida').href = '#';
                    document.getElementById('modalArchivoSalida').textContent = 'Sin archivo';
                }

                // Establecer la URL del PDF en el enlace
                document.getElementById('pdfLink').href = `/patente_alcohol/generate_salida_pdf/${solicitudId}/`;

                // Mostrar el modal
                modal.style.display = 'block';
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'No se pudo obtener los detalles de la salida.',
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
                text: 'Error al obtener los detalles de la salida.',
            });
        });

    // Manejar el cierre del modal al hacer clic en la 'x'
    spanClose.onclick = function () {
        modal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Escucha el envío del formulario de Salida y lo envía vía AJAX con confirmación.
 */
document.getElementById('salidaForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const solicitudId = document.getElementById('salidaSolicitudId').value;
    const numeroSalida = document.getElementById('numero_salida').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const archivoAdjunto = document.getElementById('archivo_adjunto_salida').files[0];

    // Validar campos obligatorios
    if (!numeroSalida || !descripcion) {
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor, complete todos los campos obligatorios.',
        });
        return;
    }

    // Mostrar ventana de confirmación
    Swal.fire({
        heightAuto: false,
        scrollbarPadding: false,
        title: '¿Estás seguro?',
        text: '¿Deseas agregar esta Salida?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Crear FormData para enviar archivos
            const formData = new FormData();
            formData.append('solicitud_id', solicitudId);
            formData.append('numero_salida', numeroSalida);
            formData.append('descripcion', descripcion);
            if (archivoAdjunto) {
                formData.append('archivo_adjunto_salida', archivoAdjunto);
            }

            // Obtener el token CSRF
            const csrftoken = getCSRFToken();

            // Enviar la solicitud vía AJAX
            fetch('/patente_alcohol/create_salida/', { // Asegúrate de que esta URL es correcta
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'success',
                            title: 'Salida agregada exitosamente',
                            showConfirmButton: false,
                            timer: 1500,
                        });

                        // Cerrar el modal
                        const modal = document.getElementById('agregarSalidaModal');
                        modal.style.display = 'none';

                        // Actualizar la fila en la tabla para indicar que se ha registrado una salida
                        const fila = document.querySelector(`tr[data-id="${solicitudId}"]`);
                        if (fila) {
                            const botonSalida = fila.querySelector('.buttonAgregarSalida');
                            if (botonSalida) {
                                botonSalida.innerHTML = `
                                    <span class="material-symbols-outlined bell">eye_tracking</span>
                                    <span class="spanText">Ver Salida</span>
                                `;
                                botonSalida.setAttribute('onclick', `openVerSalidaModal('${solicitudId}')`);
                                botonSalida.classList.remove('buttonAgregarSalida', 'disabled-button');
                                botonSalida.classList.add('buttonVerSalida'); // Opcional: para estilos específicos
                            }
                        }
                    } else {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: data.message || 'Error al agregar la salida.',
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
                        text: 'Error al enviar la salida.',
                    });
                });
        }
        // Si el usuario cancela, no hacer nada
    });
});

/**
 * Escucha el envío del formulario de Agregar Número de Ingreso y lo envía vía AJAX con confirmación.
 */
document.getElementById('numeroIngresoForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const form = e.target;
    const solicitudId = document.getElementById('numeroIngresoSolicitudId').value;
    const numeroIngreso = document.getElementById('numero_ingreso').value.trim();

    // Validar campo obligatorio
    if (!numeroIngreso) {
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            icon: 'warning',
            title: 'Campo incompleto',
            text: 'Por favor, ingrese el Número de Ingreso.',
        });
        return;
    }

    // Mostrar ventana de confirmación
    Swal.fire({
        heightAuto: false,
        scrollbarPadding: false,
        title: '¿Estás seguro?',
        text: '¿Deseas agregar este Número de Ingreso?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            // Crear FormData para enviar
            const formData = new FormData();
            formData.append('solicitud_id', solicitudId);
            formData.append('numero_ingreso', numeroIngreso);

            // Obtener el token CSRF
            const csrftoken = getCSRFToken();

            // Enviar la solicitud vía AJAX
            fetch('/patente_alcohol/update_numero_ingreso/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'success',
                            title: 'Número de Ingreso agregado exitosamente',
                            showConfirmButton: false,
                            timer: 1500,
                        });

                        // Cerrar el modal
                        const modal = document.getElementById('agregarNumeroIngresoModal');
                        modal.style.display = 'none';

                        // Actualizar la fila en la tabla para mostrar el número de ingreso
                        const fila = document.querySelector(`tr[data-id="${solicitudId}"]`);
                        if (fila) {
                            const numeroIngresoCell = fila.children[0]; // Primer <td>
                            numeroIngresoCell.innerHTML = escapeHtml(data.numero_ingreso);

                            // Habilitar el botón "Agregar Salida" si estaba deshabilitado
                            const botonSalida = fila.querySelector('.buttonAgregarSalida');
                            if (botonSalida && botonSalida.classList.contains('disabled-button')) {
                                botonSalida.innerHTML = `
                                    <span class="material-symbols-outlined bell">add_box</span>
                                    <span class="spanText">Nº Salida</span>
                                `;
                                botonSalida.setAttribute('onclick', `openAgregarSalidaModal('${solicitudId}')`);
                                botonSalida.classList.remove('disabled-button');
                            }
                        }
                    } else {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: data.message || 'Error al agregar el Número de Ingreso.',
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
                        text: 'Error al enviar el Número de Ingreso.',
                    });
                });
        }
        // Si el usuario cancela, no hacer nada
    });
});

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
