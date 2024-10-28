// bnup_form.js

(function () {
    // Variable para almacenar el tipo de usuario
    let tipo_usuario;

    /**
     * Inicializa la página BNUP, configurando variables y funciones necesarias.
     */
    function initializeBNUPPage() {
        const cardContent = document.querySelector('.cardContent');
        tipo_usuario = cardContent ? cardContent.getAttribute('data-tipo-usuario') : null;

        // Inicializar componentes si el formulario BNUP está presente
        if (document.querySelector('#bnupForm')) {
            updateBNUPFields();
            updateEditBNUPFields();
            initializeNewDeptoFeature();
            initializeFileModal();
            initializeBNUPFormModal();
        }

        // Inicializar selección de filas y estilos de tabla
        initializeRowSelection();
        borde_thead();
    }

    /**
     * Inicializa el modal para la selección y confirmación de archivos.
     */
    function initializeFileModal() {
        const modalButton = document.getElementById('openFileModal');
        const fileModal = document.getElementById('fileModal');
        const closeModalButton = fileModal ? fileModal.querySelector('.close') : null;
        const confirmButton = document.getElementById('confirmButton');
        const fileModalInput = document.getElementById('fileModalInput');
        const archivoAdjuntoInput = document.getElementById('archivo_adjunto');

        // Verificar la existencia de elementos necesarios
        if (!modalButton || !fileModal || !closeModalButton || !confirmButton || !fileModalInput || !archivoAdjuntoInput) {
            return;
        }

        // Evento para abrir el modal
        modalButton.onclick = () => {
            fileModal.style.display = 'block';
        };

        // Evento para cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            fileModal.style.display = 'none';
        };

        // Evento para cerrar el modal al hacer clic fuera de él
        fileModal.addEventListener('click', (event) => {
            if (event.target === fileModal) {
                fileModal.style.display = 'none';
            }
        });

        // Evento para confirmar la selección del archivo
        confirmButton.onclick = () => {
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

        // Configurar el plugin fileinput para mejorar la experiencia de carga de archivos
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

        // Sincronizar la selección de archivos entre los inputs
        fileModalInput.onchange = () => {
            archivoAdjuntoInput.files = fileModalInput.files;
        };
    }

    /**
     * Abre el modal de salidas, mostrando o no el formulario de creación según el tipo de usuario.
     * @param {string} solicitudId - ID de la solicitud para la cual se mostrarán las salidas.
     */
    function openSalidaModal(solicitudId) {
        if (['ADMIN', 'PRIVILEGIADO', 'ALIMENTADOR', 'VISUALIZADOR'].includes(tipo_usuario)) {
            const salidaModal = document.getElementById('salidaModal');
            const salidaCloseButton = salidaModal ? salidaModal.querySelector('.close') : null;
            const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');

            if (!salidaModal || !salidaCloseButton || !tablaSalidasBody) {
                console.error('Elementos del modal de salida no encontrados.');
                return;
            }

            // Mostrar el modal de salidas
            salidaModal.style.display = 'block';

            // Evento para cerrar el modal al hacer clic en el botón de cerrar
            salidaCloseButton.onclick = () => {
                salidaModal.style.display = 'none';
            };

            // Evento para cerrar el modal al hacer clic fuera de él
            window.onclick = (event) => {
                if (event.target === salidaModal) {
                    salidaModal.style.display = 'none';
                }
            };

            // Limpiar la tabla de salidas
            tablaSalidasBody.innerHTML = '';

            // Obtener las salidas asociadas a la solicitud mediante una solicitud AJAX
            fetch(`/bnup/get_salidas/${solicitudId}/`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        data.salidas.forEach(salida => {
                            const row = document.createElement('tr');

                            // Columna para el número de salida
                            const numeroSalidaCell = document.createElement('td');
                            numeroSalidaCell.textContent = salida.numero_salida;
                            row.appendChild(numeroSalidaCell);

                            // Columna para la fecha de salida
                            const fechaSalidaCell = document.createElement('td');
                            fechaSalidaCell.textContent = salida.fecha_salida;
                            row.appendChild(fechaSalidaCell);

                            // Columna para el archivo adjunto
                            const archivoCell = document.createElement('td');
                            if (salida.archivo_url) {
                                const link = document.createElement('a');
                                link.href = salida.archivo_url;
                                link.target = '_blank';
                                link.setAttribute('aria-label', 'Ver Archivo');
                                link.setAttribute('title', 'Ver Archivo');

                                const iconSpan = document.createElement('span');
                                iconSpan.classList.add('material-symbols-outlined');
                                iconSpan.textContent = 'preview';

                                link.appendChild(iconSpan);
                                archivoCell.appendChild(link);
                            } else {
                                archivoCell.textContent = 'No adjunto';
                            }
                            row.appendChild(archivoCell);

                            tablaSalidasBody.appendChild(row);
                        });

                        // Inicializar funciones adicionales después de llenar la tabla
                        initializeTable('tablaSalidas', 'paginationSalidas', 8, 'searchSalidas');
                    } else {
                        console.error('Error al obtener las salidas:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error al obtener las salidas:', error);
                });

            // Si el usuario no es 'VISUALIZADOR', inicializar el formulario para crear salidas
            if (['ADMIN', 'PRIVILEGIADO', 'ALIMENTADOR'].includes(tipo_usuario)) {
                const solicitudInput = document.getElementById('solicitud_id');
                if (!solicitudInput) {
                    console.error('Elemento solicitud_id no encontrado.');
                    return;
                }
                solicitudInput.value = solicitudId;

                // Resetear el formulario
                const salidaForm = document.getElementById('salidaForm');
                if (salidaForm) {
                    salidaForm.reset();
                }

                // Manejo del botón "Guardar" con confirmación previa usando SweetAlert2
                const saveButton = document.getElementById('guardarSalida');
                if (saveButton) {
                    saveButton.onclick = (event) => {
                        event.preventDefault();

                        // Obtener valores de los campos del formulario
                        const numeroSalida = document.getElementById('numero_salida').value.trim();
                        const fechaSalida = document.getElementById('fecha_salida').value.trim();
                        const archivoAdjuntoInput = document.getElementById('archivo_adjunto_salida');
                        const archivoAdjunto = archivoAdjuntoInput.files[0];

                        // Validar que todos los campos estén completos
                        if (!numeroSalida || !fechaSalida || !archivoAdjunto) {
                            Swal.fire({
                                heightAuto: false,
                                scrollbarPadding: false,
                                icon: 'error',
                                title: 'Campos incompletos',
                                text: 'Por favor, complete todos los campos antes de guardar.',
                                confirmButtonColor: '#E73C45',
                            });
                            return;
                        }

                        // Mostrar ventana de confirmación
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            title: '¿Desea confirmar la salida?',
                            text: "Se guardará la salida con los datos ingresados.",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#4BBFE0',
                            cancelButtonColor: '#E73C45',
                            confirmButtonText: 'Guardar',
                            cancelButtonText: 'Cancelar',
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Enviar el formulario vía AJAX
                                const formData = new FormData();
                                formData.append('solicitud_id', solicitudId);
                                formData.append('numero_salida', numeroSalida);
                                formData.append('fecha_salida', fechaSalida);
                                formData.append('archivo_adjunto_salida', archivoAdjunto);

                                fetch('/bnup/create_salida/', {
                                    method: 'POST',
                                    headers: {
                                        'X-CSRFToken': getCSRFToken(),
                                    },
                                    body: formData,
                                })
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.success) {
                                            // Actualizar la tabla de salidas con el nuevo registro
                                            const salida = data.salida;
                                            const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');

                                            const row = document.createElement('tr');

                                            // Columna para el número de salida
                                            const numeroSalidaCell = document.createElement('td');
                                            numeroSalidaCell.textContent = salida.numero_salida;
                                            row.appendChild(numeroSalidaCell);

                                            // Columna para la fecha de salida
                                            const fechaSalidaCell = document.createElement('td');
                                            fechaSalidaCell.textContent = salida.fecha_salida;
                                            row.appendChild(fechaSalidaCell);

                                            // Columna para el archivo adjunto
                                            const archivoCell = document.createElement('td');
                                            if (salida.archivo_url) {
                                                const link = document.createElement('a');
                                                link.href = salida.archivo_url;
                                                link.target = '_blank';
                                                link.setAttribute('aria-label', 'Ver Archivo');
                                                link.setAttribute('title', 'Ver Archivo');

                                                const iconSpan = document.createElement('span');
                                                iconSpan.classList.add('material-symbols-outlined');
                                                iconSpan.textContent = 'preview';

                                                link.appendChild(iconSpan);
                                                archivoCell.appendChild(link);
                                            } else {
                                                archivoCell.textContent = 'No adjunto';
                                            }
                                            row.appendChild(archivoCell);

                                            // Añadir la nueva fila al principio de la tabla
                                            tablaSalidasBody.insertBefore(row, tablaSalidasBody.firstChild);

                                            // Limpiar los campos del formulario
                                            document.getElementById('numero_salida').value = '';
                                            document.getElementById('fecha_salida').value = '';
                                            archivoAdjuntoInput.value = '';
                                            // Si estás usando fileinput plugin:
                                            $(archivoAdjuntoInput).fileinput('clear');

                                            Swal.fire({
                                                heightAuto: false,
                                                scrollbarPadding: false,
                                                icon: 'success',
                                                title: 'Salida creada',
                                                text: 'La salida ha sido registrada correctamente.',
                                                showConfirmButton: false,
                                                timer: 2000,
                                            });
                                        } else {
                                            Swal.fire({
                                                heightAuto: false,
                                                scrollbarPadding: false,
                                                icon: 'error',
                                                title: 'Error',
                                                text: data.error || 'Ha ocurrido un error al crear la salida.',
                                            });
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error al crear la salida:', error);
                                        Swal.fire({
                                            heightAuto: false,
                                            scrollbarPadding: false,
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Ha ocurrido un error al crear la salida.',
                                        });
                                    });
                            }
                        });
                    };
                }

                // Inicializar el plugin fileinput para el input de adjuntar archivo en salidas
                const archivoAdjuntoSalidaInput = document.getElementById('archivo_adjunto_salida');
                if (archivoAdjuntoSalidaInput) {
                    $(archivoAdjuntoSalidaInput).fileinput({
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
            } else {
                // Si el usuario es 'VISUALIZADOR', asegurarse de que el formulario no se muestre
                const salidaFields = document.getElementById('salidaFields');
                if (salidaFields) {
                    salidaFields.style.display = 'none';
                }
            }
        } else {
            // Mostrar mensaje de acceso denegado si el usuario no tiene permisos
            Swal.fire({
                heightAuto: false,
                scrollbarPadding: false,
                icon: 'warning',
                title: 'Acceso denegado',
                text: 'No tiene permiso para realizar esta acción.',
            });
        }
    }

    /**
     * Actualiza la visibilidad de los campos en el formulario BNUP según el tipo de recepción seleccionado.
     */
    function updateBNUPFields() {
        const tipoRecepcionSelect = document.getElementById('tipo_recepcion');
        const memoFields = document.getElementById('memoFields');
        const correoFields = document.getElementById('correoFields');

        if (!tipoRecepcionSelect || !memoFields || !correoFields) {
            return;
        }

        /**
         * Alterna la visibilidad de los campos según el valor seleccionado en el tipo de recepción.
         */
        function toggleFields() {
            const selectedValue = tipoRecepcionSelect.value;

            if (['1', '3', '4', '5'].includes(selectedValue)) {
                memoFields.style.display = 'block';
                correoFields.style.display = 'none';
            } else if (selectedValue === '2') {
                memoFields.style.display = 'none';
                correoFields.style.display = 'block';
            } else {
                memoFields.style.display = 'none';
                correoFields.style.display = 'none';
            }
        }

        // Evento para cambiar la visibilidad cuando se selecciona un tipo de recepción diferente
        tipoRecepcionSelect.addEventListener('change', toggleFields);
        toggleFields();
    }

    /**
     * Inicializa el modal del formulario BNUP con confirmación de guardado.
     */
    function initializeBNUPFormModal() {
        const modal = document.getElementById('bnupFormModal');
        const btn = document.getElementById('openBNUPFormModal');
        const closeModalButton = modal ? modal.querySelector('.close') : null;

        if (!btn || !modal || !closeModalButton) {
            return;
        }

        // Evento para abrir el modal del formulario BNUP
        btn.onclick = () => {
            modal.style.display = 'block';
        };

        // Evento para cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            modal.style.display = 'none';
        };

        // Evento para cerrar el modal al hacer clic fuera de él
        document.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Evento para manejar el guardado del formulario BNUP con confirmación previa
        const saveButton = document.getElementById('guardarBNUP');
        if (saveButton) {
            saveButton.onclick = (event) => {
                event.preventDefault();

                const numeroIngreso = document.getElementById('numeroIngreso').value.trim();
                const archivoAdjuntoInput = document.getElementById('archivo_adjunto');
                const archivoAdjunto = archivoAdjuntoInput ? archivoAdjuntoInput.files.length : 0;

                // Validar que todos los campos requeridos estén completos
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

                // Mostrar ventana de confirmación antes de guardar
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
                        // Enviar el formulario BNUP
                        document.getElementById('bnupForm').submit();
                    }
                });
            };
        }
    }

    /**
     * Aplica estilos de borde redondeado a los encabezados de la tabla.
     */
    function borde_thead() {
        const tableRow = document.querySelector('tr');

        if (tableRow) {
            const thElements = tableRow.querySelectorAll('th');

            if (thElements.length > 0) {
                thElements[0].style.borderRadius = '10px 0px 0px 0px';
                thElements[thElements.length - 1].style.borderRadius = '0px 10px 0px 0px';
            }
        }
    }

    /**
     * Inicializa la selección de filas en la tabla, manejando botones de acción según el tipo de usuario.
     */
    function initializeRowSelection() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const rowCheckboxes = document.querySelectorAll('.rowCheckbox');

        const deleteButton = document.getElementById('deleteSelected');
        const editButton = document.getElementById('editSelected');

        // Ajustar la visibilidad de los botones según el tipo de usuario
        if (deleteButton && tipo_usuario !== 'ADMIN') {
            deleteButton.style.display = 'none';
        }

        if (editButton && !['ADMIN', 'PRIVILEGIADO'].includes(tipo_usuario)) {
            editButton.style.display = 'none';
        }

        /**
         * Alterna el resaltado de una fila basada en si está seleccionada.
         * @param {HTMLElement} row - Fila de la tabla.
         * @param {boolean} isChecked - Estado del checkbox.
         */
        function toggleRowHighlight(row, isChecked) {
            if (isChecked) {
                row.classList.add('fila-marcada');
            } else {
                row.classList.remove('fila-marcada');
            }
        }

        /**
         * Actualiza el estado de los botones de acción según las filas seleccionadas.
         */
        function updateActionButtonsState() {
            const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
            const anyChecked = selectedCheckboxes.length > 0;

            if (deleteButton) {
                deleteButton.disabled = !anyChecked;
            }

            if (editButton) {
                editButton.disabled = !anyChecked;
            }
        }

        // Evento para seleccionar o deseleccionar todas las filas
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            selectAllCheckbox.addEventListener('change', () => {
                rowCheckboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                    toggleRowHighlight(checkbox.closest('tr'), checkbox.checked);
                });
                updateActionButtonsState();
            });
        }

        // Eventos para cada checkbox de fila individual
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const row = checkbox.closest('tr');
                toggleRowHighlight(row, checkbox.checked);

                // Verificar si todas las filas están seleccionadas
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allChecked;
                }

                updateActionButtonsState();
            });
        });

        // Evento para el botón de editar
        if (editButton) {
            editButton.addEventListener('click', () => {
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
            deleteButton.addEventListener('click', () => {
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
                        const idsToDelete = selectedCheckboxes.map(cb => cb.getAttribute('data-id'));
                        deleteSelectedRecords(idsToDelete);
                    }
                });
            });
        }
    }

    /**
     * Inicializa el modal de edición de una solicitud específica.
     * @param {string} solicitudId - ID de la solicitud a editar.
     */
    function openEditModal(solicitudId) {
        const editModal = document.getElementById('editBNUPFormModal');
        const closeModalButton = editModal ? editModal.querySelector('.close') : null;
        const editForm = document.getElementById('editBNUPForm');

        if (!editModal || !closeModalButton || !editForm) {
            console.error('Elementos del modal de edición no encontrados.');
            return;
        }

        // Resetear el formulario antes de cargar nuevos datos
        editForm.reset();

        // Obtener los datos de la solicitud mediante una solicitud AJAX
        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Rellenar el formulario con los datos obtenidos
                    document.getElementById('edit_solicitud_id').value = data.data.id;
                    document.getElementById('edit_numeroIngreso').value = data.data.numero_ingreso;
                    document.getElementById('edit_nombreSolicitante').value = data.data.nombre_solicitante;
                    document.getElementById('edit_fecha').value = data.data.fecha_ingreso;
                    document.getElementById('edit_descripcion').value = data.data.descripcion;

                    const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
                    tipoRecepcionSelect.value = data.data.tipo_recepcion;
                    updateEditBNUPFields();

                    if (['1', '3', '4', '5'].includes(data.data.tipo_recepcion.toString())) {
                        document.getElementById('edit_num_memo').value = data.data.numero_memo || '';
                    } else if (data.data.tipo_recepcion.toString() === '2') {
                        document.getElementById('edit_correoSolicitante').value = data.data.correo_solicitante || '';
                    }

                    const deptoSelect = document.getElementById('edit_depto_solicitante');
                    deptoSelect.value = data.data.depto_solicitante;

                    const funcionarioSelect = document.getElementById('edit_funcionarioAsignado');
                    funcionarioSelect.value = data.data.funcionario_asignado;

                    // Mostrar el modal de edición
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

        // Evento para cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            editModal.style.display = 'none';
        };

        // Evento para cerrar el modal al hacer clic fuera de él
        document.addEventListener('click', (event) => {
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });

        // Evento para manejar el guardado de cambios con confirmación previa
        const saveButton = document.getElementById('guardarEdicionBNUP');
        if (saveButton) {
            saveButton.onclick = (event) => {
                event.preventDefault();

                // Mostrar ventana de confirmación
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

                                    // Actualizar la fila correspondiente en la tabla
                                    updateTableRow(solicitudId);
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
    }

    /**
     * Actualiza la visibilidad de los campos en el formulario de edición BNUP según el tipo de recepción seleccionado.
     */
    function updateEditBNUPFields() {
        const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
        const memoFields = document.getElementById('edit_memoFields');
        const correoFields = document.getElementById('edit_correoFields');

        if (!tipoRecepcionSelect || !memoFields || !correoFields) {
            return;
        }

        /**
         * Alterna la visibilidad de los campos según el valor seleccionado en el tipo de recepción.
         */
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

        // Evento para cambiar la visibilidad cuando se selecciona un tipo de recepción diferente
        tipoRecepcionSelect.addEventListener('change', toggleFields);
        toggleFields();
    }

    /**
     * Actualiza una fila específica de la tabla con los datos más recientes de la solicitud.
     * @param {string} solicitudId - ID de la solicitud a actualizar.
     */
    function updateTableRow(solicitudId) {
        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                    if (row) {
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
                console.error('Error al actualizar la fila:', error);
            });
    }

    /**
     * Elimina los registros seleccionados mediante una solicitud AJAX.
     * @param {Array<string>} ids - Array de IDs de los registros a eliminar.
     */
    function deleteSelectedRecords(ids) {
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
                    // Remover las filas eliminadas de la tabla
                    ids.forEach(id => {
                        const checkbox = document.querySelector(`.rowCheckbox[data-id="${id}"]`);
                        if (checkbox) {
                            const row = checkbox.closest('tr');
                            if (row) {
                                row.remove();
                            }
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

                    // Resetear el estado de los botones y checkboxes
                    const deleteButton = document.getElementById('deleteSelected');
                    const selectAllCheckbox = document.getElementById('selectAll');
                    if (deleteButton) deleteButton.disabled = true;
                    if (selectAllCheckbox) selectAllCheckbox.checked = false;
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
                console.error('Error al eliminar registros:', error);
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Error',
                    text: 'Ha ocurrido un error al eliminar los registros.',
                });
            });
    }

    /**
     * Obtiene el token CSRF necesario para las solicitudes POST.
     * @returns {string|null} - Token CSRF o null si no se encuentra.
     */
    function getCSRFToken() {
        let cookieValue = null;
        const name = 'csrftoken';
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(`${name}=`)) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    /**
     * Formatea una cadena de fecha al formato 'dd/mm/yyyy'.
     * @param {string} dateString - Fecha en formato ISO o similar.
     * @returns {string} - Fecha formateada o cadena vacía si es inválida.
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const day = (`0${date.getDate()}`).slice(-2);
        const month = (`0${date.getMonth() + 1}`).slice(-2);
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Obtiene el texto correspondiente al tipo de recepción a partir de su ID.
     * @param {string} tipoRecepcionId - ID del tipo de recepción.
     * @returns {string} - Texto del tipo de recepción o cadena vacía si no se encuentra.
     */
    function getTipoRecepcionText(tipoRecepcionId) {
        const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
        const option = tipoRecepcionSelect ? tipoRecepcionSelect.querySelector(`option[value="${tipoRecepcionId}"]`) : null;
        return option ? option.textContent : '';
    }

    /**
     * Obtiene el texto correspondiente al departamento a partir de su ID.
     * @param {string} deptoId - ID del departamento.
     * @returns {string} - Texto del departamento o cadena vacía si no se encuentra.
     */
    function getDepartamentoText(deptoId) {
        const deptoSelect = document.getElementById('edit_depto_solicitante');
        const option = deptoSelect ? deptoSelect.querySelector(`option[value="${deptoId}"]`) : null;
        return option ? option.textContent : '';
    }

    /**
     * Obtiene el texto correspondiente al funcionario a partir de su ID.
     * @param {string} funcionarioId - ID del funcionario.
     * @returns {string} - Texto del funcionario o cadena vacía si no se encuentra.
     */
    function getFuncionarioText(funcionarioId) {
        const funcionarioSelect = document.getElementById('edit_funcionarioAsignado');
        const option = funcionarioSelect ? funcionarioSelect.querySelector(`option[value="${funcionarioId}"]`) : null;
        return option ? option.textContent : '';
    }

    /**
     * Escapa caracteres especiales en una cadena para prevenir inyecciones de HTML.
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

    /**
     * Trunca una cadena de texto y añade '...' si excede la longitud máxima.
     * @param {string} text - Texto a truncar.
     * @param {number} maxLength - Longitud máxima permitida.
     * @returns {string} - Texto truncado o original si no excede.
     */
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }

    // Dentro de bnup_form.js

    /**
     * Inicializa la funcionalidad para agregar un nuevo departamento desde el formulario.
     */
    function initializeNewDeptoFeature() {
        const addDeptoButton = document.getElementById('addDeptoButton');
        const deptoSelect = document.getElementById('depto_solicitante');
        const newDeptoContainer = document.getElementById('newDeptoContainer');
        const newDeptoInput = document.getElementById('newDeptoInput');
        const saveNewDeptoButton = document.getElementById('saveNewDeptoButton');
        const cancelNewDeptoButton = document.getElementById('cancelNewDeptoButton');

        if (!addDeptoButton || !deptoSelect || !newDeptoContainer || !newDeptoInput || !saveNewDeptoButton || !cancelNewDeptoButton) {
            console.error('Elementos para la funcionalidad de nuevo departamento no encontrados.');
            return;
        }

        // Mostrar el campo para ingresar nuevo departamento
        addDeptoButton.addEventListener('click', () => {
            deptoSelect.style.display = 'none';
            addDeptoButton.style.display = 'none';
            newDeptoContainer.style.display = 'flex';
            newDeptoInput.focus();
        });

        // Guardar el nuevo departamento
        saveNewDeptoButton.addEventListener('click', () => {
            const newDeptoName = newDeptoInput.value.trim();
            if (newDeptoName === '') {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'Nombre inválido',
                    text: 'Por favor, ingrese un nombre para el nuevo departamento.',
                });
                return;
            }

            // Enviar solicitud AJAX para guardar el nuevo departamento
            fetch('/bnup/add_departamento/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                body: JSON.stringify({ nombre: newDeptoName }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Añadir el nuevo departamento al select
                        const newOption = document.createElement('option');
                        newOption.value = data.departamento.id;
                        newOption.textContent = data.departamento.nombre;
                        deptoSelect.appendChild(newOption);

                        // Establecer el select en el nuevo departamento
                        deptoSelect.value = data.departamento.id;

                        // Restaurar el select y ocultar el contenedor de nuevo departamento
                        deptoSelect.style.display = '';
                        addDeptoButton.style.display = '';
                        newDeptoContainer.style.display = 'none';
                        newDeptoInput.value = '';

                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'success',
                            title: 'Departamento agregado',
                            text: 'El nuevo departamento ha sido agregado y seleccionado.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    } else {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: data.error || 'Ocurrió un error al agregar el departamento.',
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
                        text: 'Ocurrió un error al agregar el departamento.',
                    });
                });
        });

        // Cancelar la adición de nuevo departamento
        cancelNewDeptoButton.addEventListener('click', () => {
            deptoSelect.style.display = '';
            addDeptoButton.style.display = '';
            newDeptoContainer.style.display = 'none';
            newDeptoInput.value = '';
        });
    }

    /**
     * Inicializa las funcionalidades específicas cuando el DOM esté completamente cargado.
     */
    document.addEventListener('DOMContentLoaded', () => {
        initializeBNUPPage();
    });

    // Exponer funciones necesarias al ámbito global para que menu.js y HTML puedan acceder a ellas
    window.initializeBNUPPage = initializeBNUPPage;
    window.updateBNUPFields = updateBNUPFields;
    window.initializeFileModal = initializeFileModal;
    window.initializeBNUPFormModal = initializeBNUPFormModal;
    window.borde_thead = borde_thead;
    window.initializeRowSelection = initializeRowSelection;
    window.openSalidaModal = openSalidaModal; // Exponer openSalidaModal
    window.openEditModal = openEditModal;     // Exponer openEditModal
    window.updateTableRow = updateTableRow;   // Exponer updateTableRow

})();

