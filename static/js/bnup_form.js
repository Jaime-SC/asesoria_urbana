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
     * Función específica para abrir el modal de descripción en BNUP.
     * @param {string} descripcion - Descripción de la solicitud.
     * @param {string} fecha_ingreso - Fecha de ingreso (formato: d/m/Y).
     * @param {string} numero_ingreso - Número de ingreso.
     * @param {string} correo_solicitante - Correo del solicitante.
     * @param {string} departamento - Departamento del solicitante.
     * @param {string} funcionarios_asignados - Funcionarios asignados (cadena separada por saltos de línea).
     * @param {string} tipo_recepcion - Tipo de recepción.
     * @param {string} tipo_solicitud - Tipo de solicitud.
     * @param {string} numero_memo - Número de memo.
     * @param {string} fecha_solicitud - Fecha de solicitud (formato: d/m/Y).
     * @param {string} tablaOrigen - Identificador de la tabla de origen.
     */
    function openBNUPDescripcionModal(
        descripcion,
        fecha_ingreso,
        numero_ingreso,
        correo_solicitante,
        departamento,
        funcionarios_asignados,
        tipo_recepcion,
        tipo_solicitud,
        numero_memo,
        fecha_solicitud,
        tablaOrigen
    ) {
        const modal = document.getElementById('descripcionModal');
        if (!modal) {
            console.error("Modal 'descripcionModal' no encontrado.");
            return;
        }
        const modalContent = modal.querySelector('.modal-content');

        const descripcionCompleta = document.getElementById('descripcionCompleta');
        const fechaIngreso = document.getElementById('fechaIngreso');
        const numeroIngresoSpan = document.getElementById('numero_ingreso');
        const correoSolicitante = document.getElementById('correo_solicitante');
        const deptoSolicitante = document.getElementById('deptoSolicitante');
        const funcionariosAsignados = document.getElementById('funcionarios_asignados');
        const tipoRecepcion = document.getElementById('tipoRecepcion');
        const tipoSolicitud = document.getElementById('tipoSolicitud');
        const numeroMemoElement = document.getElementById('numeroMemo');
        const fechaSolicitudElement = document.getElementById('fechaSolicitud'); // Nuevo elemento para la fecha de solicitud
        const correoField = document.getElementById('correoField');

        // Verificar la existencia de cada elemento (puedes dejar estos console.error para debug)
        if (!descripcionCompleta) { console.error("Elemento 'descripcionCompleta' no encontrado."); }
        if (!fechaIngreso) { console.error("Elemento 'fechaIngreso' no encontrado."); }
        if (!numeroIngresoSpan) { console.error("Elemento 'numero_ingreso' no encontrado."); }
        if (!correoSolicitante) { console.error("Elemento 'correo_solicitante' no encontrado."); }
        if (!deptoSolicitante) { console.error("Elemento 'deptoSolicitante' no encontrado."); }
        if (!funcionariosAsignados) { console.error("Elemento 'funcionarios_asignados' no encontrado."); }
        if (!tipoRecepcion) { console.error("Elemento 'tipoRecepcion' no encontrado."); }
        if (!tipoSolicitud) { console.error("Elemento 'tipoSolicitud' no encontrado."); }
        if (!numeroMemoElement) { console.error("Elemento 'numeroMemo' no encontrado."); }
        if (!fechaSolicitudElement) { console.error("Elemento 'fechaSolicitud' no encontrado."); }
        if (!correoField) { console.error("Elemento 'correoField' no encontrado."); }

        // Rellenar los campos del modal con los datos proporcionados
        if (descripcionCompleta) descripcionCompleta.textContent = descripcion;
        if (fechaIngreso) fechaIngreso.textContent = fecha_ingreso;
        if (numeroIngresoSpan) numeroIngresoSpan.textContent = numero_ingreso;
        if (tipoRecepcion) tipoRecepcion.textContent = tipo_recepcion;
        if (tipoSolicitud) tipoSolicitud.textContent = tipo_solicitud;
        if (numeroMemoElement) numeroMemoElement.textContent = numero_memo;
        if (deptoSolicitante) deptoSolicitante.textContent = departamento;
        if (fechaSolicitudElement) fechaSolicitudElement.textContent = fecha_solicitud; // Asignar la nueva fecha de solicitud

        // Reemplazar comas por saltos de línea para los funcionarios asignados
        if (funcionariosAsignados) funcionariosAsignados.textContent = funcionarios_asignados;

        // Mostrar u ocultar el campo de correo según la tabla de origen
        if (correoField) {
            if (!correo_solicitante || correo_solicitante === "None") {
                correoSolicitante.textContent = "Sin correo asignado";
                correoSolicitante.style = "color: red;";
            } else {
                correoSolicitante.textContent = correo_solicitante;
                correoSolicitante.style = "color: black;";
            }
            correoField.style.display = 'flex';
        }
        

        // Mostrar u ocultar el campo de número de memo según si tiene un valor
        if (numeroMemoElement) {
            if (numero_memo) {
                numeroMemoElement.parentElement.style.display = 'flex';
            } else {
                numeroMemoElement.parentElement.style.display = 'none';
            }
        }

        modal.style.display = 'block';
        modalContent.classList.add('animate__bounceIn');
        // modalContent.classList.remove('animate__bounceOut');

        // Manejar el cierre del modal
        const spanClose = modal.querySelector('.close');
        if (spanClose) {
            spanClose.onclick = function () {

                // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
                modalContent.classList.remove('animate__bounceIn');
                modalContent.classList.add('animate__bounceOut');
                // modal.style.display = 'none';

                // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
                modalContent.addEventListener('animationend', function handleAnimationEnd() {
                    modal.style.display = 'none';
                    // Limpia la clase de salida para que la próxima vez se use la de entrada
                    modalContent.classList.remove('animate__bounceOut');
                    modalContent.classList.add('animate__bounceIn');
                    // Remover el listener para no duplicar eventos
                    modalContent.removeEventListener('animationend', handleAnimationEnd);
                });

            };
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = 'block';
                modalContent.classList.add('animate__bounceOut');
                
                setTimeout(() => {
                    modalContent.style.display = 'none';
                    modal.style.display = 'none';
                    modalContent.classList.remove('animate__animated', 'animate__bounceOut');
                    modalContent.style.display = 'block';

                }, 700);


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
     * Abre el modal de salidas, mostrando o no el formulario de creación según el tipo de usuario.
     * Agrega animaciones de entrada (bounceIn) y de salida (bounceOut).
     * @param {string} solicitudId - ID de la solicitud para la cual se mostrarán las salidas.
     */
    function openSalidaModal(solicitudId) {
        if (['ADMIN', 'PRIVILEGIADO', 'ALIMENTADOR', 'VISUALIZADOR'].includes(tipo_usuario)) {
            const salidaModal = document.getElementById('salidaModal');
            const salidaModalContent = document.getElementById('salidaModalContent');
            const salidaCloseButton = salidaModal ? salidaModal.querySelector('.close') : null;
            const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');

            if (!salidaModal || !salidaCloseButton || !tablaSalidasBody) {
                console.error('Elementos del modal de salida no encontrados.');
                return;
            }

            // Quitar cualquier animación previa y agregar la de entrada
            salidaModalContent.classList.remove('animate__bounceOut');
            salidaModalContent.classList.add('animate__animated', 'animate__bounceIn');
            salidaModal.style.display = 'block';

            // Función para cerrar el modal con animación de salida
            function closeModal() {
                salidaModalContent.classList.remove('animate__bounceIn');
                salidaModalContent.classList.add('animate__bounceOut');
                // Suponiendo que la duración de la animación es de 800ms (ajustar si es necesario)
                setTimeout(() => {
                    salidaModal.style.display = 'none';
                    salidaModalContent.classList.remove('animate__animated', 'animate__bounceOut');
                }, 800);
            }

            salidaCloseButton.onclick = closeModal;
            window.onclick = function (event) {
                if (event.target === salidaModal) {
                    closeModal();
                }
            };

            tablaSalidasBody.innerHTML = '';

            fetch(`/bnup/get_salidas/${solicitudId}/`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
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

                        // Inicializar la tabla, etc.
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

            if (['1', '3', '4', '5', '6', '7'].includes(selectedValue)) { // IDs para Memo, Providencia, Oficio, Ordinario
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
        // const formModal = document.getElementById('modal-content');
        const content = modal.querySelector('.modal-content');
        const btn = document.getElementById('openBNUPFormModal');
        const closeModalButton = modal ? modal.querySelector('.close') : null;

        if (!btn || !modal || !closeModalButton) {
            return;
        }

        // Evento para abrir el modal del formulario BNUP
        btn.onclick = () => {
            modal.style.display = 'block';
            content.classList.add('animate__bounceIn');
            content.classList.remove('animate__bounceOut');
        };

        // Evento para cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            // modal.style.display = 'none';

            // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
            content.addEventListener('animationend', function handleAnimationEnd() {
                modal.style.display = 'none';
                // Limpia la clase de salida para que la próxima vez se use la de entrada
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');
                // Remover el listener para no duplicar eventos
                content.removeEventListener('animationend', handleAnimationEnd);
            });
        };

        // Evento para cerrar el modal al hacer clic fuera de él
        document.addEventListener('click', (event) => {
            if (event.target === modal) {
                // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__bounceOut');
                // modal.style.display = 'none';

                // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
                content.addEventListener('animationend', function handleAnimationEnd() {
                    modal.style.display = 'none';
                    // Limpia la clase de salida para que la próxima vez se use la de entrada
                    content.classList.remove('animate__bounceOut');
                    content.classList.add('animate__bounceIn');
                    // Remover el listener para no duplicar eventos
                    content.removeEventListener('animationend', handleAnimationEnd);
                });
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
    * Inicializa el modal de edición de una solicitud específica.
    * @param {string} solicitudId - ID de la solicitud a editar.
    */
    function openEditModal(solicitudId) {
        const editModal = document.getElementById('editBNUPFormModal');
        const content = editModal.querySelector('.modal-content');
        const closeModalButton = editModal ? editModal.querySelector('.close') : null;
        const editForm = document.getElementById('editBNUPForm');


        if (!editModal || !closeModalButton || !editForm) {
            console.error('Elementos del modal de edición no encontrados.');
            return;
        }

        // Resetear el formulario antes de cargar nuevos datos
        editForm.reset();

        // Evento para cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            // modal.style.display = 'none';

            // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
            content.addEventListener('animationend', function handleAnimationEnd() {
                editModal.style.display = 'none';
                // Limpia la clase de salida para que la próxima vez se use la de entrada
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');
                // Remover el listener para no duplicar eventos
                content.removeEventListener('animationend', handleAnimationEnd);
            });
        };

        // Evento para cerrar el modal al hacer clic fuera de él
        document.addEventListener('click', (event) => {
            if (event.target === editModal) {
                // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__bounceOut');
                // modal.style.display = 'none';

                // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
                content.addEventListener('animationend', function handleAnimationEnd() {
                    editModal.style.display = 'none';
                    // Limpia la clase de salida para que la próxima vez se use la de entrada
                    content.classList.remove('animate__bounceOut');
                    content.classList.add('animate__bounceIn');
                    // Remover el listener para no duplicar eventos
                    content.removeEventListener('animationend', handleAnimationEnd);
                });
            }
        });

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

                    // NUEVO CAMPO: Fecha de Solicitud
                    const fechaSolicitudInput = document.getElementById('edit_fecha_solicitud');
                    if (fechaSolicitudInput) {
                        if (data.data.fecha_solicitud) {
                            fechaSolicitudInput.value = data.data.fecha_solicitud;
                        } else {
                            fechaSolicitudInput.value = '';
                        }
                    }

                    const descripcionField = document.getElementById('edit_descripcion');
                    if (descripcionField) descripcionField.value = data.data.descripcion;

                    const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
                    if (tipoRecepcionSelect) {
                        tipoRecepcionSelect.value = data.data.tipo_recepcion;
                        updateEditBNUPFields();
                    }

                    if (['1', '3', '4', '5', '6', '7'].includes(data.data.tipo_recepcion.toString())) { // IDs para Memo, Providencia, Oficio, Ordinario
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

                    // (Se elimina la antigua referencia a "fecha_salida_solicitante" ya que ahora usamos "fecha_solicitud")

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

        

        // Evento para manejar el guardado de cambios con confirmación previa
        const saveButton = document.getElementById('guardarEdicionBNUP');
        if (saveButton) {
            saveButton.onclick = (event) => {
                event.preventDefault();

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
                                    updateTableRow(solicitudId);
                                    editModal.style.display = 'none';
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
     * Inicializa el modal para la selección y confirmación de archivos.
     */
    function initializeFileModal() {
        const modalButton = document.getElementById('openFileModal');
        const fileModal = document.getElementById('fileModal'); // Asegúrate de tener un modal definido para archivos
        const closeModalButton = fileModal ? fileModal.querySelector('.close') : null;
        const confirmButton = document.getElementById('confirmButton');
        const fileModalInput = document.getElementById('fileModalInput');
        // El input del formulario lo dejamos en el modal o lo vinculamos a este
        const archivoAdjuntoInput = document.getElementById('archivo_adjunto');
        const content = fileModal.querySelector('.modal-content');

    
        // Verificar que existan todos los elementos necesarios
        if (!modalButton || !fileModal || !closeModalButton || !confirmButton || !fileModalInput || !archivoAdjuntoInput) {
            return;
        }
    
        // Cuando se hace clic en el botón de adjuntar, se muestra el modal para archivos
        modalButton.onclick = () => {
            fileModal.style.display = 'block';
            content.classList.add('animate__bounceIn');
            content.classList.remove('animate__bounceOut');
        };
    
        // Cerrar el modal al hacer clic en el botón de cerrar
        closeModalButton.onclick = () => {
            // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            // fileModal.style.display = 'none';

            // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
            content.addEventListener('animationend', function handleAnimationEnd() {
                fileModal.style.display = 'none';
                // Limpia la clase de salida para que la próxima vez se use la de entrada
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');
                // Remover el listener para no duplicar eventos
                content.removeEventListener('animationend', handleAnimationEnd);
            });
        };
    
        // Cerrar el modal al hacer clic fuera de él
        fileModal.addEventListener('click', (event) => {
            if (event.target === fileModal) {
                // Cambiar la animación de entrada por la de salida (por ejemplo, bounceOut)
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__bounceOut');
                // fileModal.style.display = 'none';

                // Cuando la animación de salida termine, ocultamos el modal y restablecemos las clases
                content.addEventListener('animationend', function handleAnimationEnd() {
                    fileModal.style.display = 'none';
                    // Limpia la clase de salida para que la próxima vez se use la de entrada
                    content.classList.remove('animate__bounceOut');
                    content.classList.add('animate__bounceIn');
                    // Remover el listener para no duplicar eventos
                    content.removeEventListener('animationend', handleAnimationEnd);
                });
            }
        });
    
        // Confirmar la selección del archivo
        confirmButton.onclick = () => {
            if (fileModalInput.files.length > 0) {
                // Asignar los archivos seleccionados al input del formulario
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
    
        // Inicializar el plugin fileinput (si usas uno)
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
        const deptoContainer = document.getElementById('deptoContainer');
        const newDeptoInput = document.getElementById('newDeptoInput');
        const saveNewDeptoButton = document.getElementById('saveNewDeptoButton');
        const cancelNewDeptoButton = document.getElementById('cancelNewDeptoButton');

        if (!addDeptoButton || !deptoSelect || !newDeptoContainer || !deptoContainer || !newDeptoInput || !saveNewDeptoButton || !cancelNewDeptoButton) {
            console.error('Elementos para la funcionalidad de nuevo solicitante no encontrados.');
            return;
        }

        // Mostrar el campo para ingresar nuevo departamento con animación "animate__bounce"
        addDeptoButton.addEventListener('click', () => {
            deptoSelect.style.display = 'none';
            addDeptoButton.style.display = 'none';
            newDeptoContainer.style.display = 'flex';
            // Agregar animación de aparición
            newDeptoContainer.style.setProperty('--animate-duration', '0.5s');
            newDeptoContainer.classList.add('animate__animated', 'animate__bounce');
            // Remover la clase de animación una vez finalizada la animación
            newDeptoContainer.addEventListener('animationend', function () {
                newDeptoContainer.classList.remove('animate__animated', 'animate__bounce');
            }, { once: true });
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

                        // Establecer el select en el nuevo departamento y mostrarlo con animación
                        deptoSelect.value = data.departamento.id;
                        deptoSelect.style.display = '';
                        deptoSelect.classList.add('animate__animated', 'animate__bounce');
                        deptoSelect.addEventListener('animationend', function () {
                            deptoSelect.classList.remove('animate__animated', 'animate__bounce');
                        }, { once: true });

                        // Restaurar el botón de agregar y ocultar el contenedor con animación de salida
                        addDeptoButton.style.display = '';
                        newDeptoContainer.style.display = 'none';
                        deptoContainer.style.setProperty('--animate-duration', '0.5s');
                        deptoSelect.classList.add('animate__animated', 'animate__bounce');
                        deptoSelect.addEventListener('animationend', function () {
                            deptoSelect.classList.remove('animate__animated', 'animate__bounce');
                        }, { once: true });
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

        // Cancelar la adición de nuevo departamento con animación de salida
        cancelNewDeptoButton.addEventListener('click', () => {
            // Agregar animación de salida al contenedor
            newDeptoContainer.style.display = 'none';
            deptoContainer.style.setProperty('--animate-duration', '0.5s');
            deptoContainer.classList.add('animate__animated', 'animate__bounce');
            deptoContainer.addEventListener('animationend', function () {
                deptoContainer.classList.remove('animate__animated', 'animate__bounce');
            }, { once: true });
            deptoSelect.style.display = '';
            addDeptoButton.style.display = '';
            newDeptoInput.value = '';
        });
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
                select.style = "max-width: 20rem;";

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
                    addBtn.style = "margin-left: 10px; padding: 0;";
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
                addBtn.style = "margin-left: 10px; padding: 0;";
                group.appendChild(addBtn);

                funcionariosContainer.appendChild(group);
            }
        }
    }

    /**
     * Crea un nuevo grupo de selección de funcionario.
     * @param {boolean} isLast - Indica si este grupo es el último (tiene botón de añadir).
     * @returns {HTMLElement} - El elemento del grupo de selección.
     */
    function createFuncionarioSelectGroup(isLast = false) {
        const group = document.createElement('div');
        group.classList.add('funcionario-select-group');
        group.style = "display: flex; align-items: center; margin-top: 10px;";

        // Crear el <select>
        const select = document.createElement('select');
        select.name = 'funcionarios_asignados';
        select.classList.add('funcionarioSelect');
        select.style = "max-width: 20rem;";
        select.required = true;

        // Añadir la opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'Seleccione';
        select.appendChild(defaultOption);

        // Clonar las opciones desde #allFuncionariosOptions
        const allOptions = document.querySelectorAll('#allFuncionariosOptions option');
        allOptions.forEach(option => {
            const clonedOption = option.cloneNode(true);
            select.appendChild(clonedOption);
        });

        group.appendChild(select);

        // Si no es el último, añadir el botón de "Cancelar"
        if (!isLast) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.classList.add('removeFuncionarioBtn', 'btn-icon');
            cancelBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
            cancelBtn.style = "margin-left: 10px; padding: 0;";
            group.appendChild(cancelBtn);
        }

        // Si es el último, añadir el botón de "Añadir"
        if (isLast) {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
            addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
            addBtn.style = "margin-left: 10px; padding: 0;";
            group.appendChild(addBtn);
        }

        // Inicializar Select2 en el nuevo select si estás usando Select2
        if (typeof $(select).select2 === 'function') {
            $(select).select2({
                placeholder: "Seleccione",
                allowClear: true,
                width: '100%'
            });
        }

        return group;
    }


    /**
     * Inicializa la funcionalidad para agregar múltiples funcionarios asignados en el formulario de creación.
     */
    function initializeMultipleFuncionarios() {
        const funcionariosContainer = document.getElementById('funcionariosContainer');
        const totalFuncionarios = parseInt(funcionariosContainer.getAttribute('data-total-funcionarios'), 10) || 12; // Default a 12 si no se proporciona

        if (!funcionariosContainer) {
            console.error('No se encontró el contenedor de funcionarios.');
            return;
        }

        // Límite máximo de selects
        const maxSelects = totalFuncionarios;

        // Función para obtener todos los valores seleccionados
        function getSelectedFuncionarios() {
            const selects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
            const selected = [];
            selects.forEach(select => {
                if (select.value) {
                    selected.push(select.value);
                }
            });
            return selected;
        }

        // Función para actualizar las opciones de todos los selects
        function updateSelectOptions() {
            const selected = getSelectedFuncionarios();
            const selects = funcionariosContainer.querySelectorAll('.funcionarioSelect');

            selects.forEach(select => {
                const currentValue = select.value;
                const options = select.querySelectorAll('option');

                options.forEach(option => {
                    if (option.value === '') return; // Ignorar la opción por defecto

                    if (selected.includes(option.value) && option.value !== currentValue) {
                        option.disabled = true;
                    } else {
                        option.disabled = false;
                    }
                });

                // Si usas Select2, actualiza el estado
                if (typeof $(select).select2 === 'function') {
                    $(select).trigger('change.select2');
                }
            });
        }

        /**
         * Añade un nuevo grupo de selección de funcionario con animación de aparición.
         * @param {HTMLElement} currentGroup - El grupo actual donde se hizo clic en "+"
         */
        function addFuncionarioSelect(currentGroup) {
            // Verificar si ya se alcanzó el límite máximo
            const currentSelects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
            if (currentSelects.length >= maxSelects) {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'Límite alcanzado',
                    text: `No puedes agregar más de ${maxSelects} funcionarios.`,
                });
                return;
            }

            // Remover el botón "+" del grupo actual
            const addBtn = currentGroup.querySelector('.addFuncionarioBtn');
            if (addBtn) {
                addBtn.remove();
            }

            // Añadir el botón de "Cancelar" al grupo actual
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.classList.add('removeFuncionarioBtn', 'btn-icon');
            cancelBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
            cancelBtn.style = "margin-left: 10px; padding: 0;";
            currentGroup.appendChild(cancelBtn);

            // Crear y añadir un nuevo grupo de selección con botón de "Añadir"
            const newGroup = createFuncionarioSelectGroup(true);
            // Asignar duración rápida (0.5s, por ejemplo)
            newGroup.style.setProperty('--animate-duration', '0.5s');
            // Agregar animación de aparición
            newGroup.classList.add('animate__animated', 'animate__fadeInDown');
            funcionariosContainer.appendChild(newGroup);
            // Remover las clases de animación una vez finalizada
            newGroup.addEventListener('animationend', function() {
                newGroup.classList.remove('animate__animated', 'animate__fadeInDown');
            });

            // Actualizar las opciones de todos los selects
            updateSelectOptions();
        }

        /**
         * Elimina un grupo de selección de funcionario con animación de salida.
         * @param {HTMLElement} group - El grupo de selección a eliminar.
         */
        function removeFuncionarioSelect(group) {
            // Asignar duración rápida (0.5s, por ejemplo)
            group.style.setProperty('--animate-duration', '0.5s');
            // Agregar animación de salida (usamos 'animate__fadeOutUp' para salida)
            group.classList.add('animate__animated', 'animate__fadeOutUp');
            // Al terminar la animación, eliminar el grupo y actualizar las opciones
            group.addEventListener('animationend', function() {
                group.remove();
                updateSelectOptions();
            }, { once: true });
        }

        // Delegar el evento de clic en el contenedor para manejar "Añadir" y "Cancelar"
        funcionariosContainer.addEventListener('click', function (event) {
            if (event.target.closest('.addFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                addFuncionarioSelect(currentGroup);
            }

            if (event.target.closest('.removeFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                removeFuncionarioSelect(currentGroup);
            }
        });

        // Inicializar los selects existentes
        const existingSelects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
        existingSelects.forEach((select, index) => {
            if (index === 0) {
                // Primer select: tiene botón de "Añadir"
                const currentGroup = select.closest('.funcionario-select-group');
                currentGroup.appendChild(createAddButton());
            } else {
                // Otros selects: tienen botón de "Cancelar"
                const currentGroup = select.closest('.funcionario-select-group');
                currentGroup.appendChild(createCancelButton());
            }
        });

        // Función para crear el botón de "Añadir"
        function createAddButton() {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
            addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
            addBtn.style = "margin-left: 10px; padding: 0;";
            return addBtn;
        }

        // Función para crear el botón de "Cancelar"
        function createCancelButton() {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.classList.add('removeFuncionarioBtn', 'btn-icon');
            cancelBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
            cancelBtn.style = "margin-left: 10px; padding: 0;";
            return cancelBtn;
        }

        // Disparar eventos 'change' para cada select preseleccionado para actualizar las opciones
        existingSelects.forEach(select => {
            if (select.value) {
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        });
    }



    /**
     * Inicializa la funcionalidad para agregar múltiples funcionarios asignados en el formulario de edición.
     */
    function initializeMultipleFuncionariosEdit() {
        const funcionariosContainer = document.getElementById('editFuncionariosContainer');

        // Verificar si el contenedor existe antes de proceder
        if (!funcionariosContainer) {
            console.warn('No se encontró el contenedor de funcionarios en el formulario de edición. Es posible que el usuario no tenga permisos para editar funcionarios asignados.');
            return; // Salir de la función si el contenedor no existe
        }

        const totalFuncionarios = parseInt(funcionariosContainer.getAttribute('data-total-funcionarios'), 10) || 12; // Default a 12 si no se proporciona

        // Límite máximo de selects
        const maxSelects = totalFuncionarios;

        // Función para obtener todos los valores seleccionados
        function getSelectedFuncionarios() {
            const selects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
            const selected = [];
            selects.forEach(select => {
                if (select.value) {
                    selected.push(select.value);
                }
            });
            return selected;
        }

        // Función para actualizar las opciones de todos los selects
        function updateSelectOptions() {
            const selected = getSelectedFuncionarios();
            const selects = funcionariosContainer.querySelectorAll('.funcionarioSelect');

            selects.forEach(select => {
                const currentValue = select.value;
                const options = select.querySelectorAll('option');

                options.forEach(option => {
                    if (option.value === '') return; // Ignorar la opción por defecto

                    if (selected.includes(option.value) && option.value !== currentValue) {
                        option.disabled = true;
                    } else {
                        option.disabled = false;
                    }
                });

                // Si usas Select2, actualiza el estado
                if (typeof $(select).select2 === 'function') {
                    $(select).trigger('change.select2');
                }
            });
        }

        /**
         * Añade un nuevo grupo de selección de funcionario en el formulario de edición con animación de aparición.
         * @param {HTMLElement} currentGroup - El grupo actual donde se hizo clic en "+"
         */
        function addFuncionarioSelectEdit(currentGroup) {
            // Verificar si ya se alcanzó el límite máximo
            const currentSelects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
            if (currentSelects.length >= maxSelects) {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'warning',
                    title: 'Límite alcanzado',
                    text: `No puedes agregar más de ${maxSelects} funcionarios.`,
                });
                return;
            }

            // Remover el botón "+" del grupo actual
            const addBtn = currentGroup.querySelector('.addFuncionarioBtn');
            if (addBtn) {
                addBtn.remove();
            }

            // Añadir el botón de "Cancelar" al grupo actual
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.classList.add('removeFuncionarioBtn', 'btn-icon');
            cancelBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
            cancelBtn.style = "margin-left: 10px; padding: 0;";
            currentGroup.appendChild(cancelBtn);

            // Crear y añadir un nuevo grupo de selección con botón de "Añadir"
            const newGroup = createFuncionarioSelectGroup(true);
            // Asignar duración rápida a la animación (0.5s)
            newGroup.style.setProperty('--animate-duration', '0.5s');
            // Agregar animación de aparición: 'animate__fadeInDown'
            newGroup.classList.add('animate__animated', 'animate__fadeInDown');
            funcionariosContainer.appendChild(newGroup);
            // Remover las clases de animación una vez finalizada la animación
            newGroup.addEventListener('animationend', function() {
                newGroup.classList.remove('animate__animated', 'animate__fadeInDown');
            });

            // Actualizar las opciones de todos los selects
            updateSelectOptions();
        }

        /**
         * Elimina un grupo de selección de funcionario con animación de salida.
         * @param {HTMLElement} group - El grupo de selección a eliminar.
         */
        function removeFuncionarioSelect(group) {
            // Asignar duración rápida a la animación (0.5s)
            group.style.setProperty('--animate-duration', '0.5s');
            // Agregar animación de salida: 'animate__fadeOutUp'
            group.classList.add('animate__animated', 'animate__fadeOutUp');
            // Una vez finalizada la animación, eliminar el grupo y actualizar las opciones
            group.addEventListener('animationend', function() {
                group.remove();
                updateSelectOptions();
            }, { once: true });
        }

        // Delegar el evento de clic en el contenedor para manejar "Añadir" y "Cancelar"
        funcionariosContainer.addEventListener('click', function (event) {
            if (event.target.closest('.addFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                addFuncionarioSelectEdit(currentGroup);
            }

            if (event.target.closest('.removeFuncionarioBtn')) {
                const currentGroup = event.target.closest('.funcionario-select-group');
                removeFuncionarioSelect(currentGroup);
            }
        });

        // Inicializar los selects existentes
        const existingSelects = funcionariosContainer.querySelectorAll('.funcionarioSelect');
        existingSelects.forEach((select, index) => {
            if (index === 0) {
                // Primer select: tiene botón de "Añadir"
                const currentGroup = select.closest('.funcionario-select-group');
                currentGroup.appendChild(createAddButton());
            } else {
                // Otros selects: tienen botón de "Cancelar"
                const currentGroup = select.closest('.funcionario-select-group');
                currentGroup.appendChild(createCancelButton());
            }
        });

        // Función para crear el botón de "Añadir"
        function createAddButton() {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.classList.add('addFuncionarioBtn', 'btn', 'btn-icon');
            addBtn.innerHTML = '<span class="material-symbols-outlined">add</span>';
            addBtn.style = "margin-left: 10px; padding: 0;";
            return addBtn;
        }

        // Función para crear el botón de "Cancelar"
        function createCancelButton() {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.classList.add('removeFuncionarioBtn', 'btn', 'btn-icon');
            cancelBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
            cancelBtn.style = "margin-left: 10px; padding: 0;";
            return cancelBtn;
        }

        // Disparar eventos 'change' para cada select preseleccionado para actualizar las opciones
        existingSelects.forEach(select => {
            if (select.value) {
                // Disparar manualmente el evento 'change' para cada select con un valor preseleccionado
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        });
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

            if (['1', '3', '4', '5', '6', '7'].includes(selectedValue)) { // IDs para Memo, Providencia, Oficio, Ordinario
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
                    // Asignamos data.data a una variable local para mayor claridad
                    const sol = data.data;
                    const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                    if (row) {
                        const cells = row.getElementsByTagName('td');

                        // Actualizar Nº Ingreso
                        cells[cellIndex++].textContent = sol.numero_ingreso;

                        // Actualizar Fecha Ingreso
                        cells[cellIndex++].textContent = formatDate(sol.fecha_ingreso_au);

                        // Actualizar Solicitante (Departamento)
                        cells[cellIndex++].textContent = sol.depto_solicitante_text;

                        // Actualizar N° Doc
                        if (sol.numero_memo) {
                            cells[cellIndex++].textContent = sol.numero_memo;
                        } else {
                            cells[cellIndex++].innerHTML = `
                                <div class="icon-container">
                                    <span class="material-symbols-outlined" style="color: #16233E;">do_not_disturb_on_total_silence</span>
                                    <div class="tooltip">Sin número de documento</div>
                                </div>
                            `;
                        }

                        // Actualizar Tipo Recepción
                        cells[cellIndex++].textContent = sol.tipo_recepcion_text;

                        // Actualizar Tipo Solicitud
                        cells[cellIndex++].textContent = sol.tipo_solicitud_text;

                        // Actualizar Funcionarios Asignados (separados por saltos de línea)
                        const funcionarios = sol.funcionarios_asignados; // Array de funcionarios
                        const funcionariosList = funcionarios.map(func => func.nombre).join('\n');
                        cells[cellIndex++].textContent = funcionariosList;

                        // Actualizar Descripción: al llamar al modal se envía la nueva fecha (fecha_solicitud)
                        cells[cellIndex++].innerHTML = `
                            <div class="descripcion-preview" onclick="openBNUPDescripcionModal(
                                '${escapeHtml(sol.descripcion)}',
                                '${formatDate(sol.fecha_ingreso_au)}',
                                '${sol.numero_ingreso}',
                                '${escapeHtml(sol.correo_solicitante)}',
                                '${escapeHtml(sol.depto_solicitante_text)}',
                                '${escapeHtml(funcionarios.map(f => f.nombre).join(','))}',
                                '${escapeHtml(sol.tipo_recepcion_text)}',
                                '${escapeHtml(sol.tipo_solicitud_text)}',
                                '${sol.numero_memo || ""}',
                                '${sol.fecha_solicitud || ""}',
                                'tablaSolicitudes')">
                                ${truncateText(sol.descripcion, 20)}
                                ${sol.descripcion.length > 1 ? '<span class="descripcion-icon"><span class="material-symbols-outlined">preview</span></span>' : ''}
                            </div>
                        `;

                        // Actualizar Entradas
                        const entradaCell = cells[cellIndex++];
                        if (sol.archivo_adjunto_ingreso_url) {
                            entradaCell.innerHTML = `
                                <div class="icon-container">                        
                                    <a href="${sol.archivo_adjunto_ingreso_url}" target="_blank" style="text-decoration: none;">
                                        <button class="buttonLogin buttonPreview">
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

                        // Actualizar Salidas
                        const salidasCell = cells[cellIndex++];
                        if (sol.salidas && sol.salidas.length > 0) {
                            salidasCell.innerHTML = `
                                <div class="icon-container">
                                    <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                        <button class="buttonLogin buttonPreview" style="background: #ffa420;">
                                            <span class="material-symbols-outlined bell">find_in_page</span>
                                            <div class="tooltip">Ver archivo de salida</div>
                                        </button>
                                    </a>
                                </div>
                            `;
                        } else {
                            salidasCell.innerHTML = `
                                <div class="icon-container">
                                    <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                        <button class="buttonLogin buttonSubirSalida">
                                            <span class="material-symbols-outlined bell">upload_file</span>
                                            <div class="tooltip">Subir Salidas</div>
                                        </button>
                                    </a>
                                </div>
                            `;
                        }
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

        // Obtener el tipo de usuario
        const tipo_usuario = document.getElementById('bnupData')
            ? document.getElementById('bnupData').getAttribute('data-tipo-usuario')
            : null;

        // Si el usuario es ADMIN o PRIVILEGIADO, añadir la celda del checkbox
        if (tipo_usuario === 'ADMIN' || tipo_usuario === 'PRIVILEGIADO') {
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('rowCheckbox');
            checkbox.setAttribute('data-id', solicitud.id);
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            checkbox.addEventListener('change', () => {
                const currentRow = checkbox.closest('tr');
                toggleRowHighlight(currentRow, checkbox.checked);

                const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
                const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
                const selectAllCheckbox = document.getElementById('selectAll');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allChecked;
                }

                updateActionButtonsState();
            });

            cellIndex = 1;
        }

        // Nº Ingreso
        const numIngresoCell = document.createElement('td');
        numIngresoCell.textContent = solicitud.numero_ingreso;
        row.appendChild(numIngresoCell);

        // Fecha Ingreso
        const fechaCell = document.createElement('td');
        fechaCell.classList.add('fechaTable');
        fechaCell.textContent = formatDate(solicitud.fecha_ingreso_au);
        row.appendChild(fechaCell);

        // Solicitante (Departamento)
        const deptoCell = document.createElement('td');
        deptoCell.textContent = solicitud.depto_solicitante_text;
        row.appendChild(deptoCell);

        // N° Doc
        const numDocCell = document.createElement('td');
        if (solicitud.numero_memo) {
            numDocCell.textContent = solicitud.numero_memo;
        } else {
            numDocCell.innerHTML = `
                <div class="icon-container">
                    <span class="material-symbols-outlined" style="color: #16233E;">do_not_disturb_on_total_silence</span>
                    <div class="tooltip">Sin número de documento</div>
                </div>
            `;
        }
        row.appendChild(numDocCell);

        // Tipo Recepción
        const recepcionCell = document.createElement('td');
        recepcionCell.textContent = solicitud.tipo_recepcion_text;
        row.appendChild(recepcionCell);

        // Tipo Solicitud
        const tipoSolicitudCell = document.createElement('td');
        tipoSolicitudCell.textContent = solicitud.tipo_solicitud_text;
        row.appendChild(tipoSolicitudCell);

        // Funcionarios Asignados (separados por saltos de línea)
        const funcionariosCell = document.createElement('td');
        const funcionarios = solicitud.funcionarios_asignados; // Array de funcionarios asignados
        const funcionariosList = funcionarios.map(func => func.nombre).join('\n');
        funcionariosCell.textContent = funcionariosList;
        row.appendChild(funcionariosCell);

        // Descripción (con llamada al modal incluyendo la fecha de solicitud)
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
                escapeHtml(funcionarios.map(f => f.nombre).join('\n')),
                escapeHtml(solicitud.tipo_recepcion_text),
                escapeHtml(solicitud.tipo_solicitud_text),
                solicitud.numero_memo || "",
                solicitud.fecha_solicitud, // Nuevo parámetro: la nueva fecha de solicitud
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

        // Entradas
        const entradaCell = document.createElement('td');
        if (solicitud.archivo_adjunto_ingreso_url) {
            entradaCell.innerHTML = `
                <div class="icon-container">                        
                    <a href="${solicitud.archivo_adjunto_ingreso_url}" target="_blank" style="text-decoration: none;">
                        <button class="buttonLogin buttonPreview">
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
        if (solicitud.salidas && solicitud.salidas.length > 0) {
            salidasCell.innerHTML = `
                <div class="icon-container">
                    <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                        <button class="buttonLogin buttonPreview" style="background: #ffa420;">
                            <span class="material-symbols-outlined bell">find_in_page</span>
                            <div class="tooltip">Ver archivo de salida</div>
                        </button>
                    </a>
                </div>
            `;
        } else {
            salidasCell.innerHTML = `
                <div class="icon-container">
                    <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                        <button class="buttonLogin buttonSubirSalida">
                            <span class="material-symbols-outlined bell">upload_file</span>
                            <div class="tooltip">Subir Salidas</div>
                        </button>
                    </a>
                </div>
            `;
        }
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
