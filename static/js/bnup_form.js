(function () {
    // Variable para almacenar el tipo de usuario
    let tipo_usuario;

    // Variables that will be used across functions
    let selectAllCheckbox;
    let rowCheckboxes;
    let deleteButton;
    let editButton;

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
            initializeStandardizeInputs(); // Utiliza la función de utilities.js
            // Inicializar la funcionalidad de múltiples funcionarios
            initializeMultipleFuncionarios();
            initializeMultipleFuncionariosEdit();
        }

        // Inicializar selección de filas y estilos de tabla
        initializeRowSelection();
        borde_thead();
    }

    /**
     * Inicializa la funcionalidad para agregar múltiples funcionarios asignados.
     */
    function initializeMultipleFuncionarios() {
        const funcionariosContainer = document.getElementById('funcionariosContainer');

        if (!funcionariosContainer) {
            console.error('No se encontró el contenedor de funcionarios.');
            return;
        }

        // Delegar el evento de clic en el contenedor
        funcionariosContainer.addEventListener('click', function (event) {
            if (event.target.closest('.addFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                addFuncionarioSelect(currentGroup);
            }
        });

        /**
         * Añade un nuevo grupo de selección de funcionario.
         * @param {HTMLElement} currentGroup - El grupo actual donde se hizo clic en "+"
         */
        function addFuncionarioSelect(currentGroup) {
            // Remover el botón "+" del grupo actual
            const addBtn = currentGroup.querySelector('.addFuncionarioBtn');
            if (addBtn) {
                addBtn.remove();
            }

            // Crear un nuevo grupo de selección
            const newGroup = document.createElement('div');
            newGroup.classList.add('funcionario-select-group');

            // Crear el nuevo <select>
            const newSelect = document.createElement('select');
            newSelect.name = 'funcionarios_asignados';
            newSelect.classList.add('funcionarioSelect');
            newSelect.required = true;

            // Añadir la opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'Seleccione';
            newSelect.appendChild(defaultOption);

            // Clonar las opciones del primer select
            const firstSelect = funcionariosContainer.querySelector('.funcionarioSelect');
            if (firstSelect) {
                Array.from(firstSelect.options).forEach(option => {
                    if (option.value !== '') { // Excluir la opción por defecto
                        const clonedOption = option.cloneNode(true);
                        newSelect.appendChild(clonedOption);
                    }
                });
            }

            newGroup.appendChild(newSelect);

            // Crear y añadir el nuevo botón "+"
            const newAddBtn = document.createElement('button');
            newAddBtn.type = 'button';
            newAddBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
            newAddBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
            newGroup.appendChild(newAddBtn);

            // Añadir el nuevo grupo al contenedor
            funcionariosContainer.appendChild(newGroup);
        }
    }


    /**
 * Función específica para abrir el modal de descripción en BNUP.
 * @param {string} descripcion - Descripción de la solicitud.
 * @param {string} fecha - Fecha de ingreso.
 * @param {string} numero_ingreso - Número de ingreso.
 * @param {string} correo_solicitante - Correo del solicitante.
 * @param {string} departamento - Departamento del solicitante.
 * @param {string} funcionario_asignado - Funcionario asignado.
 * @param {string} tablaOrigen - Identificador de la tabla de origen.
 */
    function openBNUPDescripcionModal(descripcion, fecha, numero_ingreso, correo_solicitante, departamento, funcionario_asignado, tablaOrigen) {
        const modal = document.getElementById('descripcionModal');
        const descripcionCompleta = document.getElementById('descripcionCompleta');
        const fechaIngreso = document.getElementById('fechaIngreso');
        const numeroIngresoSpan = document.getElementById('numero_ingreso');
        const correoSolicitante = document.getElementById('correo_solicitante');
        const deptoSolicitante = document.getElementById('deptoSolicitante');
        const funcionarioAsignado = document.getElementById('funcionario_asignado');
        const correoField = document.getElementById('correoField');

        // Rellenar los campos del modal con los datos proporcionados
        descripcionCompleta.textContent = descripcion;
        fechaIngreso.textContent = fecha;
        numeroIngresoSpan.textContent = numero_ingreso;
        deptoSolicitante.textContent = departamento;
        funcionarioAsignado.textContent = funcionario_asignado;

        // Mostrar u ocultar el campo de correo según la tabla de origen
        if (tablaOrigen === 'tablaSolicitudesCorreo' && correo_solicitante) {
            correoSolicitante.textContent = correo_solicitante;
            correoField.style.display = 'flex';
        } else {
            correoField.style.display = 'none';
        }

        modal.style.display = 'block';

        // Manejar el cierre del modal
        const spanClose = modal.querySelector('.close');
        spanClose.onclick = function () {
            modal.style.display = 'none';
        };

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    window.openBNUPDescripcionModal = openBNUPDescripcionModal;

    /**
     * Función para cerrar el modal de descripción.
     */
    function closeDescripcionModal() {
        const modal = document.getElementById('descripcionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.closeDescripcionModal = closeDescripcionModal;


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
                                                archivoCell.innerHTML = `
                                                    <a href="${salida.archivo_url}" target="_blank" style="text-decoration: none;">
                                                        <span class="material-symbols-outlined" style="color: green;">preview</span>
                                                    </a>
                                                `;
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

            if (['1', '3', '4', '5'].includes(selectedValue)) { // IDs para Memo, Providencia, Oficio, Ordinario
                memoFields.style.display = 'block';
                correoFields.style.display = 'none';
            } else if (selectedValue === '2') { // ID para Correo
                memoFields.style.display = 'none';
                correoFields.style.display = 'block';
            } else {
                memoFields.style.display = 'block';
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

                const bnupForm = document.getElementById('bnupForm');
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
                    title: '¿Desea confirmar la Solicitud?',
                    text: "Se guardará la solicitud junto con el archivo adjunto.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#4BBFE0',
                    cancelButtonColor: '#E73C45',
                    confirmButtonText: 'Guardar',
                    cancelButtonText: 'Cancelar',
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Enviar el formulario BNUP vía AJAX
                        const formData = new FormData(bnupForm);

                        fetch('/bnup/', {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': getCSRFToken(),
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
                                        title: 'Solicitud creada',
                                        text: 'La solicitud ha sido registrada correctamente.',
                                        showConfirmButton: false,
                                        timer: 2000,
                                    });

                                    // Agregar el nuevo registro a la tabla
                                    addTableRow(data.solicitud);

                                    // Cerrar el modal
                                    modal.style.display = 'none';

                                    // Limpiar el formulario
                                    bnupForm.reset();
                                    // Si usas fileinput plugin para el archivo adjunto
                                    $(archivoAdjuntoInput).fileinput('clear');
                                } else {
                                    Swal.fire({
                                        heightAuto: false,
                                        scrollbarPadding: false,
                                        icon: 'error',
                                        title: 'Error',
                                        text: data.error || 'Ha ocurrido un error al crear la solicitud.',
                                    });
                                }
                            })
                            .catch(error => {
                                console.error('Error al crear la solicitud:', error);
                                Swal.fire({
                                    heightAuto: false,
                                    scrollbarPadding: false,
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Ha ocurrido un error al crear la solicitud.',
                                });
                            });
                    }
                });
            };
        }

    }

    /**
     * Inicializa la selección de filas en la tabla, manejando botones de acción según el tipo de usuario.
     */
    function initializeRowSelection() {
        selectAllCheckbox = document.getElementById('selectAll');
        rowCheckboxes = document.querySelectorAll('.rowCheckbox');

        deleteButton = document.getElementById('deleteSelected');
        editButton = document.getElementById('editSelected');

        // Adjust button visibility based on user type
        if (deleteButton && tipo_usuario !== 'ADMIN') {
            deleteButton.style.display = 'none';
        }

        if (editButton && !['ADMIN', 'PRIVILEGIADO'].includes(tipo_usuario)) {
            editButton.style.display = 'none';
        }

        // Event for selecting or deselecting all rows
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

        // Events for individual row checkboxes
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const row = checkbox.closest('tr');
                toggleRowHighlight(row, checkbox.checked);

                // Update the list of checkboxes
                rowCheckboxes = document.querySelectorAll('.rowCheckbox');

                // Check if all rows are selected
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allChecked;
                }

                updateActionButtonsState();
            });
        });

        // Event for the edit button
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

        // Event for the delete button
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

                // Confirm deletion
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
            console.error('Elementos para la funcionalidad de nuevo solicitante no encontrados.');
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
                    text: 'Por favor, ingrese un nombre para el nuevo solicitante.',
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
                            title: 'Solicitante agregado',
                            text: 'El nuevo solicitante ha sido agregado y seleccionado.',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    } else {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: data.error || 'Ocurrió un error al agregar el solicitante.',
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
                        text: 'Ocurrió un error al agregar el solicitante.',
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Rellenar el formulario con los datos obtenidos
                    const solicitudIdField = document.getElementById('edit_solicitud_id');
                    if (solicitudIdField) solicitudIdField.value = data.data.id;

                    const numeroIngresoField = document.getElementById('edit_numeroIngreso');
                    if (numeroIngresoField) numeroIngresoField.value = data.data.numero_ingreso;

                    const fechaIngresoField = document.getElementById('edit_fecha_ingreso_au');
                    if (fechaIngresoField) fechaIngresoField.value = data.data.fecha_ingreso_au;

                    const descripcionField = document.getElementById('edit_descripcion');
                    if (descripcionField) descripcionField.value = data.data.descripcion;

                    const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
                    if (tipoRecepcionSelect) {
                        tipoRecepcionSelect.value = data.data.tipo_recepcion;
                        updateEditBNUPFields();
                    }

                    if (['1', '3', '4', '5'].includes(data.data.tipo_recepcion.toString())) { // IDs para Memo, Providencia, Oficio, Ordinario
                        const numMemoField = document.getElementById('edit_num_memo');
                        if (numMemoField) numMemoField.value = data.data.numero_memo || '';
                    } else if (data.data.tipo_recepcion.toString() === '2') { // ID para Correo
                        const correoSolicitanteField = document.getElementById('edit_correoSolicitante');
                        if (correoSolicitanteField) correoSolicitanteField.value = data.data.correo_solicitante || '';
                    }

                    const deptoSelect = document.getElementById('edit_depto_solicitante');
                    if (deptoSelect) deptoSelect.value = data.data.depto_solicitante;

                    const tipoSolicitudSelect = document.getElementById('edit_tipo_solicitud');
                    if (tipoSolicitudSelect) tipoSolicitudSelect.value = data.data.tipo_solicitud;

                    const fechaEgresoInput = document.getElementById('edit_fecha_salida_solicitante');
                    if (fechaEgresoInput) {
                        if (data.data.fecha_salida_solicitante) {
                            fechaEgresoInput.value = data.data.fecha_salida_solicitante;
                        } else {
                            fechaEgresoInput.value = '';
                        }
                    }

                    // Cargar los funcionarios asignados en el formulario de edición
                    loadEditFormData(data.data);

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
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Error en la respuesta del servidor');
                                }
                                return response.json();
                            })
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
                                    });

                                    // Actualizar la fila correspondiente en la tabla
                                    updateTableRow(solicitudId);

                                    // Cerrar el modal de edición
                                    const editModal = document.getElementById('editBNUPFormModal');
                                    if (editModal) {
                                        editModal.style.display = 'none';
                                    }
                                } else {
                                    Swal.fire({
                                        heightAuto: false,
                                        scrollbarPadding: false,
                                        icon: 'error',
                                        title: 'Error',
                                        text: data.error || 'Ha ocurrido un error al actualizar la solicitud.',
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
 * Carga los datos de una solicitud en el formulario de edición.
 * @param {Object} data - Datos de la solicitud.
 */
    function loadEditFormData(data) {
        // Limpiar los selects actuales de funcionarios asignados
        const funcionariosContainer = document.getElementById('editFuncionariosContainer');
        if (funcionariosContainer) {
            funcionariosContainer.innerHTML = '';

            data.funcionarios_asignados.forEach((funcionario, index) => {
                const group = document.createElement('div');
                group.classList.add('funcionario-select-group');

                const select = document.createElement('select');
                select.name = 'funcionarios_asignados';
                select.classList.add('funcionarioSelect');
                select.required = true;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = 'Seleccione';
                select.appendChild(defaultOption);

                // Clone options from #allFuncionariosOptions
                const allOptions = document.querySelectorAll('#allFuncionariosOptions option');
                allOptions.forEach(option => {
                    const clonedOption = option.cloneNode(true);
                    if (option.value === funcionario.id.toString()) {
                        clonedOption.selected = true;
                    }
                    select.appendChild(clonedOption);
                });

                group.appendChild(select);

                // Añadir el botón "+" solo al último funcionario
                if (index === data.funcionarios_asignados.length - 1) {
                    const addBtn = document.createElement('button');
                    addBtn.type = 'button';
                    addBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
                    addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
                    group.appendChild(addBtn);
                }

                funcionariosContainer.appendChild(group);
            });

            // Si no hay funcionarios asignados, crear al menos un select
            if (data.funcionarios_asignados.length === 0) {
                const group = document.createElement('div');
                group.classList.add('funcionario-select-group');

                const select = document.createElement('select');
                select.name = 'funcionarios_asignados';
                select.classList.add('funcionarioSelect');
                select.required = true;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = 'Seleccione';
                select.appendChild(defaultOption);

                // Clone options from #allFuncionariosOptions
                const allOptions = document.querySelectorAll('#allFuncionariosOptions option');
                allOptions.forEach(option => {
                    const clonedOption = option.cloneNode(true);
                    select.appendChild(clonedOption);
                });

                group.appendChild(select);

                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
                addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
                group.appendChild(addBtn);

                funcionariosContainer.appendChild(group);
            }
        }
    }

    /**
     * Inicializa la funcionalidad para agregar múltiples funcionarios asignados en el formulario de edición.
     */
    function initializeMultipleFuncionariosEdit() {
        const funcionariosContainer = document.getElementById('editFuncionariosContainer');

        if (!funcionariosContainer) {
            console.error('No se encontró el contenedor de funcionarios en el formulario de edición.');
            return;
        }

        // Delegar el evento de clic en el contenedor
        funcionariosContainer.addEventListener('click', function (event) {
            if (event.target.closest('.addFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                addFuncionarioSelectEdit(currentGroup);
            }
        });

        /**
         * Añade un nuevo grupo de selección de funcionario en el formulario de edición.
         * @param {HTMLElement} currentGroup - El grupo actual donde se hizo clic en "+"
         */
        function addFuncionarioSelectEdit(currentGroup) {
            // Remover el botón "+" del grupo actual
            const addBtn = currentGroup.querySelector('.addFuncionarioBtn');
            if (addBtn) {
                addBtn.remove();
            }

            // Crear un nuevo grupo de selección
            const newGroup = document.createElement('div');
            newGroup.classList.add('funcionario-select-group');

            // Crear el nuevo <select>
            const newSelect = document.createElement('select');
            newSelect.name = 'funcionarios_asignados';
            newSelect.classList.add('funcionarioSelect');
            newSelect.required = true;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'Seleccione';
            newSelect.appendChild(defaultOption);

            // Clone options from #allFuncionariosOptions
            const allOptions = document.querySelectorAll('#allFuncionariosOptions option');
            allOptions.forEach(option => {
                const clonedOption = option.cloneNode(true);
                newSelect.appendChild(clonedOption);
            });

            newGroup.appendChild(newSelect);

            // Crear y añadir el nuevo botón "+"
            const newAddBtn = document.createElement('button');
            newAddBtn.type = 'button';
            newAddBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
            newAddBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
            newGroup.appendChild(newAddBtn);

            // Añadir el nuevo grupo al contenedor
            funcionariosContainer.appendChild(newGroup);
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

            if (['1', '3', '4', '5'].includes(selectedValue)) { // IDs para Memo, Providencia, Oficio, Ordinario
                memoFields.style.display = 'block';
                correoFields.style.display = 'none';
            } else if (selectedValue === '2') { // ID para Correo
                memoFields.style.display = 'none';
                correoFields.style.display = 'block';
            } else {
                memoFields.style.display = 'block';
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
        const bnupData = document.getElementById('bnupData');
        const tipo_usuario = bnupData ? bnupData.getAttribute('data-tipo-usuario') : null;
        let cellIndex = 0;

        if (tipo_usuario === 'ADMIN' || tipo_usuario === 'PRIVILEGIADO') {
            cellIndex = 1; // Ajustar índice si hay checkbox
        }

        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                    if (row) {
                        const cells = row.getElementsByTagName('td');

                        // Actualizar Nº Ingreso
                        cells[cellIndex++].textContent = data.data.numero_ingreso;

                        // Actualizar Fecha
                        cells[cellIndex++].textContent = formatDate(data.data.fecha_ingreso_au);

                        // Actualizar Departamento
                        cells[cellIndex++].textContent = getDepartamentoText(data.data.depto_solicitante);

                        // Actualizar Recepción
                        cells[cellIndex++].textContent = data.data.tipo_recepcion_text;

                        // Actualizar N° Doc
                        if (data.data.numero_memo) {
                            cells[cellIndex++].textContent = data.data.numero_memo;
                        } else {
                            cells[cellIndex++].innerHTML = `
                                <div class="icon-container">
                                    <span class="material-symbols-outlined" style="color: #E73C45;">error</span>
                                    <div class="tooltip">Sin número de documento</div>
                                </div>
                            `;
                        }

                        // Actualizar Correo
                        // if (data.data.correo_solicitante) {
                        //     cells[cellIndex++].textContent = data.data.correo_solicitante;
                        //     cells[cellIndex - 1].setAttribute('data-order', data.data.correo_solicitante.toLowerCase());
                        // } else {
                        //     cells[cellIndex++].innerHTML = `
                        //         <div class="icon-container">
                        //             <span class="material-symbols-outlined" style="color: #E73C45;">mail_off</span>
                        //             <div class="tooltip">Sin Correo</div>
                        //         </div>
                        //     `;
                        //     cells[cellIndex - 1].setAttribute('data-order', 'zzz');
                        // }



                        // Actualizar Funcionario
                        // cells[cellIndex++].textContent = getFuncionarioText(data.data.funcionario_asignado);
                        // Actualizar Funcionarios
                        const funcionarios = data.data.funcionarios_asignados; // Array de funcionarios
                        const funcionariosList = funcionarios.map(func => func.nombre).join(', ');
                        cells[cellIndex++].textContent = funcionariosList;


                        // Actualizar Descripción
                        cells[cellIndex++].innerHTML = `
                            <div class="descripcion-preview" onclick="openDescripcionModal('${escapeHtml(data.data.descripcion)}', '${escapeHtml(data.data.nombre_solicitante)}', '${formatDate(data.data.fecha_ingreso_au)}', '${data.data.numero_ingreso}', '${escapeHtml(data.data.correo_solicitante)}', '${escapeHtml(getDepartamentoText(data.data.depto_solicitante))}', '${escapeHtml(getFuncionarioText(data.data.funcionario_asignado))}', 'tablaSolicitudes')">
                                ${truncateText(data.data.descripcion, 20)}
                                ${data.data.descripcion.length > 1 ? '<span class="descripcion-icon"><span class="material-symbols-outlined">preview</span></span>' : ''}
                            </div>
                        `;

                        // Aquí podrías actualizar los nuevos campos si los has añadido a la tabla

                    }
                }
            })
            .catch(error => {
                console.error('Error al actualizar la fila:', error);
            });
    }

    /**
     * Agrega una nueva fila a la tabla de solicitudes con los datos proporcionados.
     * @param {Object} solicitud - Objeto que contiene los datos de la solicitud.
     */
    function addTableRow(solicitud) {
        const tablaSolicitudesBody = document.querySelector('#tablaSolicitudes tbody');
        if (!tablaSolicitudesBody) {
            console.error('No se encontró la tabla de solicitudes.');
            return;
        }

        // Crear la nueva fila
        const row = document.createElement('tr');
        row.setAttribute('data-id', solicitud.id);

        let cellIndex = 0;

        // Si el usuario es ADMIN o PRIVILEGIADO, añadir la celda del checkbox
        if (tipo_usuario === 'ADMIN' || tipo_usuario === 'PRIVILEGIADO') {
            // Crear la celda y el checkbox
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('rowCheckbox');
            checkbox.setAttribute('data-id', solicitud.id);

            // Añadir el checkbox a la celda y la celda a la fila
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // Añadir event listener al checkbox
            checkbox.addEventListener('change', () => {
                const row = checkbox.closest('tr');
                toggleRowHighlight(row, checkbox.checked);

                // Verificar si todas las filas están seleccionadas
                rowCheckboxes = document.querySelectorAll('.rowCheckbox');
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allChecked;
                }

                updateActionButtonsState();
            });

            cellIndex = 1; // Ajustar índice si hay checkbox
        }

        // Añadir celdas correspondientes a cada columna
        // Nº Ingreso
        const numIngresoCell = document.createElement('td');
        numIngresoCell.textContent = solicitud.numero_ingreso;
        row.appendChild(numIngresoCell);

        // Fecha
        const fechaCell = document.createElement('td');
        fechaCell.classList.add('fechaTable');
        fechaCell.textContent = formatDate(solicitud.fecha_ingreso_au);
        row.appendChild(fechaCell);

        // Departamento
        const deptoCell = document.createElement('td');
        deptoCell.textContent = solicitud.depto_solicitante_text;
        row.appendChild(deptoCell);

        // Recepción
        const recepcionCell = document.createElement('td');
        recepcionCell.textContent = solicitud.tipo_recepcion_text;
        row.appendChild(recepcionCell);

        // N° Doc
        const numDocCell = document.createElement('td');
        if (solicitud.numero_memo) {
            numDocCell.textContent = solicitud.numero_memo;
        } else {
            numDocCell.innerHTML = `
                <div class="icon-container">
                    <span class="material-symbols-outlined" style="color: #E73C45;">error</span>
                    <div class="tooltip">Sin número de documento</div>
                </div>
            `;
        }
        row.appendChild(numDocCell);

        // Correo
        // const correoCell = document.createElement('td');
        // if (solicitud.correo_solicitante) {
        //     correoCell.textContent = solicitud.correo_solicitante;
        //     correoCell.setAttribute('data-order', solicitud.correo_solicitante.toLowerCase());
        // } else {
        //     correoCell.innerHTML = `
        //         <div class="icon-container">
        //             <span class="material-symbols-outlined" style="color: #E73C45;">mail_off</span>
        //             <div class="tooltip">Sin Correo</div>
        //         </div>
        //     `;
        //     correoCell.setAttribute('data-order', 'zzz');
        // }
        // row.appendChild(correoCell);



        // Funcionario
        // const funcionarioCell = document.createElement('td');
        // funcionarioCell.textContent = solicitud.funcionario_asignado_text;
        // row.appendChild(funcionarioCell);

        // Funcionarios
        const funcionariosCell = document.createElement('td');
        const funcionarios = solicitud.funcionarios_asignados; // Array de funcionarios asignados

        // Crear una lista o cadena de nombres
        const funcionariosList = funcionarios.map(func => func.nombre).join(', ');
        funcionariosCell.textContent = funcionariosList;
        row.appendChild(funcionariosCell);

        // Descripción
        const descripcionCell = document.createElement('td');
        const descripcionDiv = document.createElement('div');
        descripcionDiv.classList.add('descripcion-preview');
        descripcionDiv.onclick = function () {
            openBNUPDescripcionModal(
                escapeHtml(solicitud.descripcion),
                formatDate(solicitud.fecha_ingreso_au),
                solicitud.numero_ingreso,
                escapeHtml(solicitud.correo_solicitante),
                escapeHtml(solicitud.depto_solicitante_text),
                escapeHtml(solicitud.funcionario_asignado_text),
                'tablaSolicitudes'
            );
        };

        descripcionDiv.innerHTML = `${truncateText(solicitud.descripcion, 20)}`;
        if (solicitud.descripcion.length > 1) {
            descripcionDiv.innerHTML += `
                <span class="descripcion-icon">
                    <span class="material-symbols-outlined">preview</span>
                </span>
            `;
        }
        descripcionCell.appendChild(descripcionDiv);
        row.appendChild(descripcionCell);

        // Entrada
        const entradaCell = document.createElement('td');
        if (solicitud.archivo_adjunto_ingreso_url) {
            entradaCell.innerHTML = `
                <div class="icon-container">                        
                    <a href="${solicitud.archivo_adjunto_ingreso_url}" target="_blank" style="text-decoration: none;">
                        <button class="buttonLogin buttonPreview" style="background-color: #bfff00;">
                            <span class="material-symbols-outlined bell">find_in_page</span>
                        </button>
                    </a>                        
                    <div class="tooltip">Ver archivo de ingreso</div>
                </div>
            `;
        } else {
            entradaCell.innerHTML = `
                <div class="icon-container">
                    <span style="color: #E73C45;" class="material-symbols-outlined">scan_delete</span>
                    <div class="tooltip">Sin archivo de ingreso</div>
                </div>
            `;
        }
        row.appendChild(entradaCell);

        // Salidas
        const salidasCell = document.createElement('td');
        salidasCell.innerHTML = `
            <div class="icon-container">
                <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                    <button class="buttonLogin buttonSubirSalida">
                        <span class="material-symbols-outlined bell">upload_file</span>
                    </button>
                </a>
                <div class="tooltip">Subir Salidas</div>
            </div>
        `;
        row.appendChild(salidasCell);

        // Insertar la nueva fila al inicio de la tabla
        tablaSolicitudesBody.insertBefore(row, tablaSolicitudesBody.firstChild);
    }



    /**
     * Inicializa las funcionalidades específicas cuando el DOM está completamente cargado.
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
