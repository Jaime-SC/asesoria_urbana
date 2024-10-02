function initializeFileModal() {
    const modalButton = document.getElementById('openFileModal');
    const closeModalButton = document.querySelector('#fileModal .close');
    const confirmButton = document.getElementById('confirmButton'); // Botón de confirmar
    const fileModal = document.getElementById('fileModal');
    const fileModalInput = document.getElementById('fileModalInput');
    const archivoAdjuntoInput = document.getElementById('archivo_adjunto');

    // Abrir el modal
    if (modalButton) {
        modalButton.onclick = function () {
            fileModal.style.display = 'block';
        };
    }

    // Cerrar el modal con el botón de cerrar
    if (closeModalButton) {
        closeModalButton.onclick = function () {
            fileModal.style.display = 'none';
        };
    }

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target === fileModal) {
            fileModal.style.display = 'none';
        }
    };

    // Confirmar selección de archivo y cerrar modal
    if (confirmButton) {
        confirmButton.onclick = function () {
            if (fileModalInput.files.length > 0) {
                archivoAdjuntoInput.files = fileModalInput.files;
                fileModal.style.display = 'none';
                Swal.fire({
                    title: 'Archivo adjuntado',
                    text: 'El archivo se ha adjuntado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Debe seleccionar un archivo antes de confirmar.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        };
    }

    // Configurar la carga de archivos
    if (fileModalInput) {
        fileModalInput.onchange = function () {
            archivoAdjuntoInput.files = fileModalInput.files;
        };

        $(fileModalInput).fileinput({
            showUpload: false,
            showRemove: true,
            showPreview: true,
            showCaption: false,
            browseLabel: '<span class="material-symbols-outlined">upload_file</span> Seleccionar archivo',
            removeLabel: '<span class="material-symbols-outlined">delete</span> Eliminar',
            mainClass: 'input-group-sm',
            dropZoneTitle: 'Arrastra y suelta los archivos aquí',
            fileActionSettings: {
                showRemove: true,
                showZoom: false,
                showDrag: false,
                showDelete: false,
            },
            layoutTemplates: {
                close: '',
                indicator: '',
                actionCancel: ''
            }
        });
    }
}


// Función para abrir el modal de archivo_adjunto_salida
function openSalidaModal(solicitudId) {
    const salidaModal = document.getElementById('salidaModal');
    const solicitudInput = document.getElementById('solicitud_id');
    const salidaCloseButton = salidaModal.querySelector('.close');

    solicitudInput.value = solicitudId;

    $('#salidaFileModalInput').fileinput({
        showUpload: false,
        showRemove: true,
        showPreview: true,
        showCaption: false,
        browseLabel: '<span class="material-symbols-outlined">upload_file</span> Seleccionar archivo',
        removeLabel: '<span class="material-symbols-outlined">delete</span> Eliminar',
        mainClass: 'input-group-sm',
        dropZoneTitle: 'Arrastra y suelta los archivos aquí',
        fileActionSettings: {
            showRemove: true,
            showUpload: false,
            showZoom: false,
            showDrag: false
        },
        layoutTemplates: {
            close: '',
            indicator: '',
            actionDelete: '',
            actionUpload: ''
        }
    });

    salidaModal.style.display = 'block';

    salidaCloseButton.onclick = function () {
        salidaModal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };

    // Manejo del botón Guardar con validación y confirmación
    const saveButton = salidaModal.querySelector('button[type="submit"]');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío del formulario por defecto

        // Verificar si ambos campos están llenos
        const numeroSalida = document.getElementById('numero_salida').value;
        const archivoAdjuntoSalida = document.getElementById('salidaFileModalInput').files.length > 0;

        if (!numeroSalida || !archivoAdjuntoSalida) {
            Swal.fire({
                title: 'Error',
                text: 'Debe ingresar el número de salida y adjuntar un archivo.',
                icon: 'error',
                confirmButtonColor: '#E73C45',
                confirmButtonText: 'Aceptar'
            });
        } else {
            // Mostrar el mensaje de confirmación si los campos están llenos
            Swal.fire({
                title: '¿Desea confirmar la Salida?',
                text: "Se guardará el número y el archivo adjunto de salida.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4BBFE0',
                cancelButtonColor: '#E73C45',
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Si el usuario confirma, enviar el formulario
                    salidaModal.querySelector('form').submit();
                }
            });
        }
    };
}

function updateBNUPFields() {
    const tipoRecepcionSelect = document.getElementById('tipo_recepcion');
    const memoFields = document.getElementById('memoFields');
    const correoFields = document.getElementById('correoFields');

    function toggleFields() {
        const selectedValue = tipoRecepcionSelect.value;

        if (['1', '3', '4', '5'].includes(selectedValue)) {  // IDs para Memo, Providencia, Oficio, Ordinario
            memoFields.style.display = 'block';
            correoFields.style.display = 'none';
        } else if (selectedValue === '2') {  // ID para Correo
            memoFields.style.display = 'none';
            correoFields.style.display = 'block';
        } else {
            memoFields.style.display = 'none';
            correoFields.style.display = 'none';
        }
    }

    tipoRecepcionSelect.addEventListener('change', toggleFields);
    toggleFields();  // Ejecutar al cargar la página para el estado inicial
}

function initializeBNUPFormModal() {
    const modal = document.getElementById('bnupFormModal');
    const btn = document.getElementById('openBNUPFormModal');
    const span = document.querySelector('#bnupFormModal .close');

    if (btn) {
        btn.onclick = function () {
            modal.style.display = 'block';
        }
    }

    if (span) {
        span.onclick = function () {
            modal.style.display = 'none';
        }
    }

    // Cerrar el modal si se hace clic fuera de él
    document.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Manejo del botón Guardar con confirmación
    const saveButton = document.getElementById('guardarBNUP');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío del formulario por defecto

        const numeroIngreso = document.getElementById('numeroIngreso').value;
        const archivoAdjunto = document.getElementById('archivo_adjunto').files.length;

        if (!numeroIngreso || archivoAdjunto === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Complete todos los campos requeridos antes de enviar.',
            });
            return;
        }

        // Mostrar el mensaje de confirmación
        Swal.fire({
            title: '¿Desea confirmar la Solicitud de BNUP?',
            text: "Se guardará la solicitud junto con el archivo adjunto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4BBFE0',
            cancelButtonColor: '#E73C45',
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, enviar el formulario
                document.getElementById('bnupForm').submit();
            }
        });
    };
}

// Función para inicializar la selección de filas
function initializeRowSelection() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.rowCheckbox');

    function toggleRowHighlight(row, isChecked) {
        if (isChecked) {
            row.classList.add('fila-marcada');
        } else {
            row.classList.remove('fila-marcada');
        }
    }

    // Función para seleccionar o deseleccionar todas las filas
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('click', function (event) {
            event.stopPropagation();  // Evita la propagación del evento para que no active el ordenamiento
        });
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
                toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);
            });
        });
    }

    // Función para seleccionar o deseleccionar una fila individual
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);

            // Si todas las filas están seleccionadas, marcar el selectAll checkbox
            const allChecked = [...rowCheckboxes].every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        });
    });
}

function borde_thead() {
    const tableRow = document.querySelector('tr');  // Seleccionar la primera fila (puedes cambiar según corresponda)

    if (tableRow) {
        const thElements = tableRow.querySelectorAll('th');  // Obtener todos los <th>

        if (thElements.length > 0) {
            // Aplicar el estilo al primer <th>
            thElements[0].style.borderRadius = '10px 0px 0px 0px';

            // Aplicar el estilo al último <th>
            thElements[thElements.length - 1].style.borderRadius = '0px 10px 0px 0px';
        }
    }
}

function initializeRowSelection() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
    const deleteButton = document.getElementById('deleteSelected');

    function toggleRowHighlight(row, isChecked) {
        if (isChecked) {
            row.classList.add('fila-marcada');
        } else {
            row.classList.remove('fila-marcada');
        }
    }

    function updateDeleteButtonState() {
        const anyChecked = Array.from(rowCheckboxes).some(checkbox => checkbox.checked);
        deleteButton.disabled = !anyChecked;
    }

    // Función para seleccionar o deseleccionar todas las filas
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('click', function (event) {
            event.stopPropagation();  // Evita la propagación del evento para que no active el ordenamiento
        });
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
                toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);
            });
            updateDeleteButtonState();
        });
    }

    // Función para seleccionar o deseleccionar una fila individual
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);

            // Si todas las filas están seleccionadas, marcar el selectAll checkbox
            const allChecked = [...rowCheckboxes].every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;

            updateDeleteButtonState();
        });
    });

    // Evento para el botón de eliminar
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            // Obtener los checkboxes seleccionados
            const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
            const numSelected = selectedCheckboxes.length;

            if (numSelected === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No hay registros seleccionados',
                    text: 'Por favor, seleccione al menos un registro para eliminar.',
                });
                return;
            }

            // Confirmar eliminación
            Swal.fire({
                title: `¿Desea eliminar ${numSelected} registro(s)?`,
                text: "Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E73C45',
                cancelButtonColor: '#4BBFE0',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Obtener los IDs de los registros seleccionados
                    const idsToDelete = selectedCheckboxes.map(cb => cb.getAttribute('data-id'));

                    // Enviar solicitud AJAX para eliminar los registros
                    deleteSelectedRecords(idsToDelete);
                }
            });
        });
    }
}

function deleteSelectedRecords(ids) {
    // Enviar solicitud AJAX al servidor
    fetch('/bnup/delete/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ ids: ids })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Eliminar las filas de la tabla
                ids.forEach(id => {
                    const checkbox = document.querySelector(`.rowCheckbox[data-id="${id}"]`);
                    if (checkbox) {
                        const row = checkbox.closest('tr');
                        row.parentNode.removeChild(row);
                    }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Registros eliminados',
                    text: 'Los registros han sido eliminados correctamente.',
                    showConfirmButton: false,
                    timer: 2000
                });
                // Actualizar el estado del botón eliminar
                const deleteButton = document.getElementById('deleteSelected');
                deleteButton.disabled = true;
                // Actualizar el estado del checkbox "select all"
                const selectAllCheckbox = document.getElementById('selectAll');
                selectAllCheckbox.checked = false;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ha ocurrido un error al eliminar los registros.',
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ha ocurrido un error al eliminar los registros.',
            });
        });
}

// Función para obtener el token CSRF
function getCSRFToken() {
    let cookieValue = null;
    const name = 'csrftoken';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // ¿Comienza esta cookie con el nombre que queremos?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Inicializar las funcionalidades específicas cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();
        initializeFileModal();
        initializeBNUPFormModal();
    }

    // Inicializar la selección de filas en la tabla
    initializeRowSelection();
    borde_thead();
});


