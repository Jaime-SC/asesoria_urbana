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
    // window.onclick = function (event) {
    //     if (event.target === fileModal) {
    //         fileModal.style.display = 'none';
    //     }
    // };

    if (fileModal) {
        fileModal.addEventListener('click', function (event) {
            if (event.target === fileModal) {
                fileModal.style.display = 'none';
            }
        });
    }
    // Confirmar selección de archivo y cerrar modal
    if (confirmButton) {
        confirmButton.onclick = function () {
            if (fileModalInput.files.length > 0) {
                archivoAdjuntoInput.files = fileModalInput.files;
                fileModal.style.display = 'none';
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    title: 'Archivo adjuntado',
                    text: 'El archivo se ha adjuntado correctamente.',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',



                });
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    title: 'Error',
                    text: 'Debe seleccionar un archivo antes de confirmar.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',

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

// bnup_form.js
// bnup_form.js

function openSalidaModal(solicitudId) {
    const salidaModal = document.getElementById('salidaModal');
    const solicitudInput = document.getElementById('solicitud_id');
    const salidaCloseButton = salidaModal.querySelector('.close');
    const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');
    const salidaFields = document.getElementById('salidaFields');

    solicitudInput.value = solicitudId;

    // Limpiar el formulario y la tabla de salidas
    document.getElementById('salidaForm').reset();
    tablaSalidasBody.innerHTML = '';

    // Obtener las salidas asociadas a la solicitud
    fetch(`/bnup/get_salidas/${solicitudId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data.salidas.forEach(salida => {
                    const row = document.createElement('tr');

                    const numeroSalidaCell = document.createElement('td');
                    numeroSalidaCell.textContent = salida.numero_salida;
                    row.appendChild(numeroSalidaCell);

                    const fechaSalidaCell = document.createElement('td');
                    fechaSalidaCell.textContent = salida.fecha_salida;
                    row.appendChild(fechaSalidaCell);

                    const archivoCell = document.createElement('td');
                    if (salida.archivo_url) {
                        const link = document.createElement('a');
                        link.href = salida.archivo_url;
                        link.target = '_blank';
                        link.setAttribute('aria-label', 'Ver Archivo'); // Mejorar accesibilidad
                        link.setAttribute('title', 'Ver Archivo'); // Tooltip

                        // Crear el icono span
                        const iconSpan = document.createElement('span');
                        iconSpan.classList.add('material-symbols-outlined');
                        iconSpan.textContent = 'preview'; // Nombre del icono

                        // Añadir el icono al enlace
                        link.appendChild(iconSpan);

                        archivoCell.appendChild(link);
                    } else {
                        archivoCell.textContent = 'No adjunto';
                    }
                    row.appendChild(archivoCell);

                    tablaSalidasBody.appendChild(row);
                });

                // Después de llenar la tabla, inicializar las funciones
                initializeTable('tablaSalidas', 'paginationSalidas', 8, 'searchSalidas');
            } else {
                console.error('Error al obtener las salidas:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al obtener las salidas:', error);
        });

    // Mostrar el modal
    salidaModal.style.display = 'block';

    // Cerrar el modal con el botón de cerrar
    salidaCloseButton.onclick = function () {
        salidaModal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };

    // Manejo del botón Guardar con confirmación previa usando SweetAlert2
    // Manejo del botón Guardar con confirmación previa usando SweetAlert2
    const saveButton = document.getElementById('guardarSalida');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío inmediato del formulario

        // Obtener los valores de los campos
        const numeroSalida = document.getElementById('numero_salida').value.trim();
        const fechaSalida = document.getElementById('fecha_salida').value.trim();
        const archivoAdjunto = document.getElementById('archivo_adjunto_salida').files[0]; // Verificamos si hay un archivo adjunto

        // Verificar si los campos están completos
        if (!numeroSalida || !fechaSalida || !archivoAdjunto) {
            // Mostrar mensaje de error si falta algún campo
            Swal.fire({
                heightAuto: false,
                scrollbarPadding: false,
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor, complete todos los campos antes de guardar.',
                confirmButtonColor: '#E73C45',

            });
            return; // Detener la ejecución si falta algún campo
        }

        // Mostrar la ventana de confirmación
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            title: '¿Desea confirmar la salida?',
            text: "Se guardará la salida con los datos ingresados.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4BBFE0', // Color del botón de confirmar
            cancelButtonColor: '#E73C45', // Color del botón de cancelar
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',

        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, enviar el formulario
                document.getElementById('salidaForm').submit();
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'success',
                    title: 'Salida creada',
                    text: 'La salida ha sido registrada correctamente.',
                    showConfirmButton: false,
                    timer: 2000,

                }).then(() => {
                    // Opcional: Recargar la página o cerrar el modal
                    sessionStorage.setItem('redirectToBNUP', 'true');
                    window.location.reload();
                });
            }
            // Si el usuario cancela, no hacer nada
        });
    };


    // Inicializar el plugin fileinput para el input de adjuntar archivo
    const archivoAdjuntoInput = document.getElementById('archivo_adjunto_salida');

    if (archivoAdjuntoInput) {
        $(archivoAdjuntoInput).fileinput({
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
                heightAuto: false,
                scrollbarPadding: false,
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Complete todos los campos requeridos antes de enviar.',

            });
            return;
        }

        // Mostrar el mensaje de confirmación
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            title: '¿Desea confirmar la Solicitud de BNUP?',
            text: "Se guardará la solicitud junto con el archivo adjunto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4BBFE0',
            cancelButtonColor: '#E73C45',
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',

        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, enviar el formulario
                document.getElementById('bnupForm').submit();
            }
        });
    };
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
    const editButton = document.getElementById('editSelected');

    function toggleRowHighlight(row, isChecked) {
        if (isChecked) {
            row.classList.add('fila-marcada');
        } else {
            row.classList.remove('fila-marcada');
        }
    }

    function updateActionButtonsState() {
        const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
        const anyChecked = selectedCheckboxes.length > 0;
        const singleChecked = selectedCheckboxes.length === 1;

        deleteButton.disabled = !anyChecked;
        editButton.disabled = !anyChecked; // Ahora el botón "Editar" se habilita si hay al menos un registro seleccionado
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
            updateActionButtonsState();
        });
    }

    // Función para seleccionar o deseleccionar una fila individual
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);

            // Si todas las filas están seleccionadas, marcar el selectAll checkbox
            const allChecked = [...rowCheckboxes].every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;

            updateActionButtonsState();
        });
    });

    // Evento para el botón de editar
    if (editButton) {
        editButton.addEventListener('click', function () {
            const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
            const numSelected = selectedCheckboxes.length;

            if (numSelected === 1) {
                const idToEdit = selectedCheckboxes[0].getAttribute('data-id');
                openEditModal(idToEdit);
            } else if (numSelected > 1) {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'Solo un registro a la vez',
                    text: 'Por favor, seleccione solo un registro para editar.',

                });
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'No hay registros seleccionados',
                    text: 'Por favor, seleccione un registro para editar.',

                });
            }
        });
    }

    // Evento para el botón de eliminar
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            // Obtener los checkboxes seleccionados
            const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
            const numSelected = selectedCheckboxes.length;

            if (numSelected === 0) {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'No hay registros seleccionados',
                    text: 'Por favor, seleccione al menos un registro para eliminar.',

                });
                return;
            }

            // Confirmar eliminación
            Swal.fire({
                heightAuto: false,
                scrollbarPadding: false,
                title: `¿Desea eliminar ${numSelected} registro(s)?`,
                text: "Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E73C45',
                cancelButtonColor: '#4BBFE0',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',

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


function openEditModal(solicitudId) {
    const editModal = document.getElementById('editBNUPFormModal');
    const closeModalButton = editModal.querySelector('.close');
    const editForm = document.getElementById('editBNUPForm');

    // Limpiar el formulario
    editForm.reset();

    // Hacer una solicitud AJAX para obtener los datos de la solicitud
    fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Poner los datos en el formulario
                document.getElementById('edit_solicitud_id').value = data.data.id;
                document.getElementById('edit_numeroIngreso').value = data.data.numero_ingreso;
                document.getElementById('edit_nombreSolicitante').value = data.data.nombre_solicitante;
                document.getElementById('edit_fecha').value = data.data.fecha_ingreso;
                document.getElementById('edit_descripcion').value = data.data.descripcion;

                // Seleccionar el tipo de recepción
                const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
                tipoRecepcionSelect.value = data.data.tipo_recepcion;

                // Mostrar u ocultar campos según el tipo de recepción
                updateEditBNUPFields();

                // Prellenar los campos de memo o correo según corresponda
                if (['1', '3', '4', '5'].includes(data.data.tipo_recepcion.toString())) {
                    document.getElementById('edit_num_memo').value = data.data.numero_memo || '';
                } else if (data.data.tipo_recepcion.toString() === '2') {
                    document.getElementById('edit_correoSolicitante').value = data.data.correo_solicitante || '';
                }

                // Seleccionar el departamento solicitante
                const deptoSelect = document.getElementById('edit_depto_solicitante');
                deptoSelect.value = data.data.depto_solicitante;

                // Seleccionar el funcionario asignado
                const funcionarioSelect = document.getElementById('edit_funcionarioAsignado');
                funcionarioSelect.value = data.data.funcionario_asignado;

                // Establecer el valor en el campo oculto
                const funcionarioHiddenInput = document.getElementById('edit_funcionarioAsignado_hidden');
                funcionarioHiddenInput.value = data.data.funcionario_asignado;

                // Mostrar el modal
                editModal.style.display = 'block';
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los datos para editar.',

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
                text: 'Ha ocurrido un error al cargar los datos.',

            });
        });

    // Cerrar el modal con el botón de cerrar
    closeModalButton.onclick = function () {
        editModal.style.display = 'none';
    };

    // Cerrar el modal al hacer clic fuera de él
    window.onclick = function (event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    };

    // Manejo del botón Guardar Cambios con confirmación
    const saveButton = document.getElementById('guardarEdicionBNUP');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío del formulario por defecto

        // Validar campos si es necesario

        // Mostrar el mensaje de confirmación
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            title: '¿Desea guardar los cambios?',
            text: "Se actualizará la solicitud con los datos ingresados.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4BBFE0',
            cancelButtonColor: '#E73C45',
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',

        }).then((result) => {
            if (result.isConfirmed) {
                // Enviar los datos mediante AJAX
                const formData = new FormData(editForm);
                fetch('/bnup/edit/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCSRFToken(),
                    },
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                heightAuto: false,
                                scrollbarPadding: false,
                                icon: 'success',
                                title: 'Solicitud actualizada',
                                text: 'Los cambios han sido guardados correctamente.',
                                showConfirmButton: false,
                                timer: 2000,

                            }).then(() => {
                                sessionStorage.setItem('redirectToBNUP', 'true');
                                window.location.reload();
                            });
                            editModal.style.display = 'none';
                            // Actualizar la fila en la tabla sin recargar la página
                            updateTableRow(solicitudId);

                            // Deshabilitar el botón de editar
                            const editButton = document.getElementById('editSelected');
                            editButton.disabled = true;

                            // Desmarcar todos los checkboxes y quitar resaltado
                            const selectAllCheckbox = document.getElementById('selectAll');
                            selectAllCheckbox.checked = false;

                            const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
                            rowCheckboxes.forEach(checkbox => {
                                checkbox.checked = false;
                                const row = checkbox.closest('tr');
                                row.classList.remove('fila-marcada');
                            });
                        } else {
                            Swal.fire({
                                heightAuto: false,
                                scrollbarPadding: false,
                                icon: 'error',
                                title: 'Error',
                                text: 'Ha ocurrido un error al actualizar la solicitud.',

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
                            text: 'Ha ocurrido un error al actualizar la solicitud.',

                        });
                    });
            }
        });
    };

}

// Función para mostrar u ocultar campos en el formulario de edición según el tipo de recepción seleccionado
function updateEditBNUPFields() {
    const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
    const memoFields = document.getElementById('edit_memoFields');
    const correoFields = document.getElementById('edit_correoFields');

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

function updateTableRow(solicitudId) {
    // Hacer una solicitud AJAX para obtener los datos actualizados
    fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Buscar la fila correspondiente en la tabla
                const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                if (row) {
                    // Actualizar los valores de las celdas
                    const cells = row.getElementsByTagName('td');

                    // Actualizar Nº Ingreso
                    cells[1].textContent = data.data.numero_ingreso;

                    // Actualizar Fecha
                    cells[2].textContent = formatDate(data.data.fecha_ingreso);

                    // Actualizar Recepción
                    cells[3].textContent = getTipoRecepcionText(data.data.tipo_recepcion);

                    // Actualizar N° Doc
                    if (data.data.numero_memo) {
                        cells[4].textContent = data.data.numero_memo;
                    } else {
                        cells[4].innerHTML = `
                            <div class="icon-container">
                                <span class="material-symbols-outlined" style="color: #E73C45;">error</span>
                                <div class="tooltip">Sin número de documento</div>
                            </div>
                        `;
                    }

                    // Actualizar Correo
                    if (data.data.correo_solicitante) {
                        cells[5].textContent = data.data.correo_solicitante;
                        cells[5].setAttribute('data-order', data.data.correo_solicitante.toLowerCase());
                    } else {
                        cells[5].innerHTML = `
                            <div class="icon-container">
                                <span class="material-symbols-outlined" style="color: #E73C45;">mail_off</span>
                                <div class="tooltip">Sin Correo</div>
                            </div>
                        `;
                        cells[5].setAttribute('data-order', 'zzz');
                    }

                    // Actualizar Solicitante
                    cells[6].textContent = data.data.nombre_solicitante;

                    // Actualizar Departamento
                    cells[7].textContent = getDepartamentoText(data.data.depto_solicitante);

                    // Actualizar Funcionario
                    cells[8].textContent = getFuncionarioText(data.data.funcionario_asignado);

                    // Actualizar Descripción
                    cells[9].innerHTML = `
                        <div class="descripcion-preview" onclick="openDescripcionModal('${escapeHtml(data.data.descripcion)}', '${escapeHtml(data.data.nombre_solicitante)}', '${formatDate(data.data.fecha_ingreso)}', '${data.data.numero_ingreso}', '${escapeHtml(data.data.correo_solicitante)}', '${escapeHtml(getDepartamentoText(data.data.depto_solicitante))}', '${escapeHtml(getFuncionarioText(data.data.funcionario_asignado))}', 'tablaSolicitudes')">
                            ${truncateText(data.data.descripcion, 20)}
                            ${data.data.descripcion.length > 1 ? '<span class="descripcion-icon"><span class="material-symbols-outlined">preview</span></span>' : ''}
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


// Función para formatear la fecha en formato 'd/m/Y'
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Función para obtener el texto del tipo de recepción a partir de su ID
function getTipoRecepcionText(tipoRecepcionId) {
    const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
    const option = tipoRecepcionSelect.querySelector(`option[value="${tipoRecepcionId}"]`);
    return option ? option.textContent : '';
}

// Función para obtener el texto del departamento a partir de su ID
function getDepartamentoText(deptoId) {
    const deptoSelect = document.getElementById('edit_depto_solicitante');
    const option = deptoSelect.querySelector(`option[value="${deptoId}"]`);
    return option ? option.textContent : '';
}

// Función para obtener el texto del funcionario a partir de su ID
function getFuncionarioText(funcionarioId) {
    const funcionarioSelect = document.getElementById('edit_funcionarioAsignado');
    const option = funcionarioSelect.querySelector(`option[value="${funcionarioId}"]`);
    return option ? option.textContent : '';
}

// Función para escapar caracteres especiales en HTML
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"'`=\/]/g, function (s) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        }[s];
    });
}

// Función para truncar texto y agregar '...'
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'success',
                    title: 'Registros eliminados',
                    text: 'Los registros han sido eliminados correctamente.',
                    showConfirmButton: false,
                    timer: 2000,

                });
                // Actualizar el estado del botón eliminar
                const deleteButton = document.getElementById('deleteSelected');
                deleteButton.disabled = true;
                // Actualizar el estado del checkbox "select all"
                const selectAllCheckbox = document.getElementById('selectAll');
                selectAllCheckbox.checked = false;
            } else {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: 'Ha ocurrido un error al eliminar los registros.',

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
        updateEditBNUPFields();
        initializeFileModal();
        initializeBNUPFormModal();
    }

    // Inicializar la selección de filas en la tabla
    initializeRowSelection();
    borde_thead();
});


