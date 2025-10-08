(function () {
    // Variable para almacenar el tipo de usuario
    let tipo_usuario;

    // Variables that will be used across functions
    let selectAllCheckbox;
    let rowCheckboxes;
    let deleteButton;
    let editButton;
    let salidaSelectAll;      // checkbox “marcar todas” dentro del modal de salidas
    let salidaRowCheckboxes;   // checkbox por fila de salida
    let btnEliminarSalidas;    // botón “Eliminar seleccionadas” en el modal
    let btnEditarSalidas;      // botón de edición en modal de salidas


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
            initializeEditFileModal();
            initializeEditSalidaFileModal();
            initializeBNUPFormModal();
            initializeStandardizeInputs();
            initializeMultiSelect({
                selectSelector: '#multi_funcionarios_ing',
                containerSelector: '#funcionariosSeleccionados_ing',
                hiddenInputSelector: '#funcionariosHidden_ing',
                // animationIn:  'animate__fadeIn',
                // animationOut: 'animate__fadeOut',
            });

            // Inicializar la funcionalidad de múltiples funcionarios
            // initializeMultipleFuncionarios();
            // initializeMultipleFuncionariosEdit();
        }

        // Inicializar selección de filas y estilos de tabla
        initializeRowSelection();
        // → Inicializo bots y checkboxes del modal de salidas
        salidaSelectAll = document.getElementById('selectAllSalidas');
        btnEliminarSalidas = document.getElementById('btnEliminarSalidas');
        btnEditarSalidas = document.getElementById('btnEditarSalidas');


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
        tipo_recepcion,          // puede llegar como id ("2") o texto ("CORREO")
        tipo_solicitud,
        numero_memo,
        fecha_solicitud,
        tablaOrigen
    ) {
        const modal = document.getElementById('descripcionModal');
        if (!modal) { console.error("Modal 'descripcionModal' no encontrado."); return; }

        const content = modal.querySelector('.modal-content');
        const spanX = modal.querySelector('.close');

        const descripcionCompleta = document.getElementById('descripcionCompleta');
        const fechaIngreso = document.getElementById('fechaIngreso');
        const numeroIngresoSpan = document.getElementById('numero_ingreso');
        const correoSolicitante = document.getElementById('correo_solicitante');
        const deptoSolicitante = document.getElementById('deptoSolicitante');
        const funcionariosAsignados = document.getElementById('funcionarios_asignados');
        const tipoRecepcionSpan = document.getElementById('tipoRecepcion');
        const tipoSolicitudSpan = document.getElementById('tipoSolicitud');
        const numeroMemoElement = document.getElementById('numeroMemo');
        const fechaSolicitudElement = document.getElementById('fechaSolicitud');
        const correoField = document.getElementById('correoField');
        const numeroMemoField = numeroMemoElement ? numeroMemoElement.parentElement : null;

        /* ---------- rellenar textos ---------- */
        descripcionCompleta && (descripcionCompleta.textContent = descripcion);
        fechaIngreso && (fechaIngreso.textContent = fecha_ingreso);
        numeroIngresoSpan && (numeroIngresoSpan.textContent = numero_ingreso);
        tipoRecepcionSpan && (tipoRecepcionSpan.textContent = tipo_recepcion);
        tipoSolicitudSpan && (tipoSolicitudSpan.textContent = tipo_solicitud);
        deptoSolicitante && (deptoSolicitante.textContent = departamento);
        fechaSolicitudElement && (fechaSolicitudElement.textContent = fecha_solicitud);

        /* ---------- funcionarios en líneas separadas ---------- */
        if (funcionariosAsignados) {
            funcionariosAsignados.textContent =
                (funcionarios_asignados || '').replace(/,\s*/g, '\n');
        }

        /* ========== NUEVA LÓGICA CORREO / MEMO ========== */
        const emailTypes = ['2', '6', 'CORREO', 'CONTRIBUYENTE'];   // ids o textos
        const isEmailType = emailTypes.includes(String(tipo_recepcion).toUpperCase());

        /* --- bloque CORREO --- */
        if (correoField) {
            if (isEmailType) {
                correoField.style.display = 'flex';

                if (!correo_solicitante || correo_solicitante === 'None') {
                    correoSolicitante.textContent = 'Sin correo asignado';
                    correoSolicitante.style.color = 'red';
                } else {
                    correoSolicitante.textContent = correo_solicitante;
                    correoSolicitante.style.color = 'black';
                }
            } else {
                correoField.style.display = 'none';
            }
        }

        /* --- bloque N° DOC (memo) --- */
        if (numeroMemoField) {
            if (isEmailType || !numero_memo) {
                numeroMemoField.style.display = 'none';
            } else {
                numeroMemoElement.textContent = numero_memo;
                numeroMemoField.style.display = 'flex';
            }
        }

        /* ---------- mostrar ---------- */
        modal.style.display = 'block';
        content.classList.remove('animate__bounceOut');
        content.classList.add('animate__animated', 'animate__bounceIn');

        /* ---------- cierre ---------- */
        let downOnOverlay = false;

        const onMouseDown = e => { downOnOverlay = (e.target === modal); };
        const onMouseUp = e => {
            if (downOnOverlay && e.target === modal) cerrar();
            downOnOverlay = false;     // reseteamos
        };

        spanX.onclick = cerrar;
        modal.addEventListener('mousedown', onMouseDown);
        modal.addEventListener('mouseup', onMouseUp);

        function cerrar() {
            // Limpia listeners para que no se dupliquen en futuras aperturas
            modal.removeEventListener('mousedown', onMouseDown);
            modal.removeEventListener('mouseup', onMouseUp);
            spanX.onclick = null;

            // Animación de salida
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            content.addEventListener('animationend', () => {
                modal.style.display = 'none';
                content.classList.remove('animate__bounceOut', 'animate__animated');
            }, { once: true });
        }
    }

    /* Exportar a window si lo usas inline */
    window.openBNUPDescripcionModal = openBNUPDescripcionModal;

    function toggleRecepcionFields(selectEl, memoWrap, correoWrap, memoInput, correoInput) {
        const val = selectEl.value;
        const esCorreo = ['2', '6'].includes(val);          // 2 = CORREO, 6 = CONTRIBUYENTE

        if (esCorreo) {
            memoWrap.style.display = 'none';
            correoWrap.style.display = 'block';

            memoInput.required = false;
            correoInput.required = true;
        } else {
            memoWrap.style.display = 'block';
            correoWrap.style.display = 'none';

            memoInput.required = true;
            correoInput.required = false;
        }
    }
    /**
     * Actualiza la visibilidad de los campos en el formulario BNUP según el tipo de recepción seleccionado.
     */
    function updateBNUPFields() {
        const recepSel = document.getElementById('tipo_recepcion');
        const memoWrap = document.getElementById('memoFields');
        const correoWrap = document.getElementById('correoFields');
        const memoInput = document.getElementById('num_memo');
        const correoInput = document.getElementById('correoSolicitante');
        if (!recepSel) return;

        recepSel.addEventListener('change', () => toggleRecepcionFields(
            recepSel, memoWrap, correoWrap, memoInput, correoInput));
        toggleRecepcionFields(recepSel, memoWrap, correoWrap, memoInput, correoInput);
    }


    /**
     * Actualiza la visibilidad de los campos en el formulario de edición BNUP según el tipo de recepción seleccionado.
     */
    function updateEditBNUPFields() {
        const recepSel = document.getElementById('edit_tipo_recepcion');
        const memoWrap = document.getElementById('edit_memoFields');
        const correoWrap = document.getElementById('edit_correoFields');
        const memoInput = document.getElementById('edit_num_memo');
        const correoInput = document.getElementById('edit_correoSolicitante');
        if (!recepSel) return;

        recepSel.addEventListener('change', () => toggleRecepcionFields(
            recepSel, memoWrap, correoWrap, memoInput, correoInput));
        toggleRecepcionFields(recepSel, memoWrap, correoWrap, memoInput, correoInput);
    }

    function resetFuncionariosIngreso() {
        const sel = document.querySelector('#multi_funcionarios_ing');
        const hid = document.querySelector('#funcionariosHidden_ing');
        const cont = document.querySelector('#funcionariosSeleccionados_ing');
        if (!sel || !hid || !cont) return;

        // 1) limpiar hidden y chips
        hid.value = '';
        cont.innerHTML = '';

        // 2) limpiar selección y re-habilitar opciones
        sel.querySelectorAll('option').forEach(o => { o.selected = false; o.disabled = false; });
        sel.selectedIndex = 0;

        // 3) si usas select2
        if ($(sel).data('select2')) $(sel).val(null).trigger('change.select2');

        // 4) 🔹 avisa al componente que borre su estado interno
        sel.dispatchEvent(new Event('ms:reset'));

        // 5) (opcional) notifica un change por si tu UI reacciona
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    }


    /**
     * Inicializa el modal del formulario BNUP con confirmación de guardado.
     */
    function initializeBNUPFormModal() {
        const modal = document.getElementById('bnupFormModal');
        if (!modal) {
            // Si el modal no existe, simplemente salimos de la función.
            return;
        }
        const content = modal.querySelector('.modal-content');
        const btn = document.getElementById('openBNUPFormModal');
        const closeModalButton = modal ? modal.querySelector('.close') : null;

        if (!btn || !modal || !closeModalButton) {
            return;
        }

        // Evento para abrir el modal del formulario BNUP
        btn.onclick = () => {
            resetFuncionariosIngreso();
            document.querySelector('#multi_funcionarios_ing')
                ?.dispatchEvent(new Event('ms:reset'));
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

                function esEmailValido(str) {
                    return /^\S+@\S+\.\S+$/.test(str);
                }

                /* en guardar BNUP */
                const tipoRecep = document.getElementById('tipo_recepcion').value;
                if (['2', '6'].includes(tipoRecep)) {
                    const mail = document.getElementById('correoSolicitante').value.trim();
                    if (!mail) {
                        Swal.fire({ icon: 'error', title: 'Correo requerido', text: 'Debe ingresar un correo.' }); return;
                    }
                    if (!esEmailValido(mail)) {
                        Swal.fire({ icon: 'error', title: 'Correo inválido', text: 'Ingrese un correo válido.' }); return;
                    }
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
                        // const formData = new FormData(bnupForm);

                        const desc = bnupForm.querySelector('#descripcion');
                        if (desc) standardizeInput(desc);
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
                                    resetFuncionariosIngreso();
                                    document.querySelector('#multi_funcionarios_ing')
                                        ?.dispatchEvent(new Event('ms:reset'));
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

                    if (['1', '3', '4', '5', '7'].includes(data.data.tipo_recepcion.toString())) { // IDs para Memo, Providencia, Oficio, Ordinario
                        const numMemoField = document.getElementById('edit_num_memo');
                        if (numMemoField) numMemoField.value = data.data.numero_memo || '';
                    } else if (['2', '6'].includes(data.data.tipo_recepcion.toString())) { // ID para Correo
                        const correoSolicitanteField = document.getElementById('edit_correoSolicitante');
                        if (correoSolicitanteField) {
                            correoSolicitanteField.value = data.data.correo_solicitante || '';
                        }
                    }

                    const deptoSelect = document.getElementById('edit_depto_solicitante');
                    if (deptoSelect) deptoSelect.value = data.data.depto_solicitante;

                    const tipoSolicitudSelect = document.getElementById('edit_tipo_solicitud');
                    if (tipoSolicitudSelect) tipoSolicitudSelect.value = data.data.tipo_solicitud;

                    // (Se elimina la antigua referencia a "fecha_salida_solicitante" ya que ahora usamos "fecha_solicitud")

                    // Cargar los funcionarios asignados en el formulario de edición
                    // loadEditFormData(data.data);

                    // pasa la URL del adjunto al botón, para que el modal la use como preview
                    const btnFile = document.getElementById('openEditFileModal');
                    if (btnFile) {
                        btnFile.dataset.currentFile = data.data.archivo_adjunto_ingreso_url || '';
                    }

                    /* ----------  vista limitada para el perfil FUNCIONARIO ---------- */
                    if (tipo_usuario === 'FUNCIONARIO') {

                        /** helper: muestra un grupo y todos sus ancestros `.form-group`  */
                        const showWithAncestors = (el) => {
                            let n = el;
                            while (n && n.id !== 'editBNUPForm') {
                                if (n.classList && n.classList.contains('form-group')) n.style.display = '';
                                n = n.parentElement;
                            }
                            el.querySelectorAll('input,textarea').forEach(i => i.disabled = false);
                        };

                        /** 1 ▸ oculta y deshabilita todo el formulario */
                        document.querySelectorAll('#editBNUPForm .form-group').forEach(g => {
                            g.style.display = 'none';
                            g.querySelectorAll('input,select,textarea').forEach(el => el.disabled = true);
                        });

                        /** 2 ▸ la descripción SIEMPRE es editable */
                        const descGrp = document.getElementById('edit_descripcion').closest('.form-group');
                        showWithAncestors(descGrp);

                        /** 3 ▸ sólo para CORREO (id 2) o CONTRIBUYENTE (id 6) mostramos el e-mail */
                        const recepId = data.data.tipo_recepcion.toString();          // «2» ó «6»
                        if (['2', '6'].includes(recepId)) {
                            const correoGrp = document.getElementById('edit_correoFields');
                            showWithAncestors(correoGrp);
                        }
                    }
                    /* ---------------------------------------------------------------- */

                    // ⬇️ PEGA AQUÍ (versión con guard)
                    {
                        const selEdit = document.querySelector('#multi_funcionarios_ing_edit');
                        if (selEdit) {
                            initializeMultiSelect({
                                selectSelector: '#multi_funcionarios_ing_edit',
                                containerSelector: '#funcionariosSeleccionados_ing_edit',
                                hiddenInputSelector: '#funcionariosHidden_ing_edit',
                            });

                            // Sembrar valores existentes (chips visibles) usando el handler 'change' una vez por funcionario
                            const sel = document.querySelector('#multi_funcionarios_ing_edit');
                            if (sel) {
                                const ids = (data.data.funcionarios_asignados || []).map(f => String(f.id));
                                sel.dispatchEvent(new CustomEvent('ms:set', { detail: { ids } }));
                            }
                            const hid = document.querySelector('#funcionariosHidden_ing_edit');
                            const cont = document.querySelector('#funcionariosSeleccionados_ing_edit');

                            // 1) limpiar estado previo
                            hid.value = '';
                            cont.innerHTML = '';
                            sel.querySelectorAll('option').forEach(o => { o.disabled = false; o.selected = false; });

                            // 2) simular selección para que se creen los chips y se deshabiliten las opciones
                            (data.data.funcionarios_asignados || []).forEach(f => {
                                sel.value = String(f.id);
                                sel.dispatchEvent(new Event('change', { bubbles: true }));
                            });

                            sel.selectedIndex = 0; // volver al placeholder
                        }
                    }


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
                        // const formData = new FormData(editForm);

                        // ► Normaliza la descripción antes de leer el formulario
                        const desc = editForm.querySelector('#edit_descripcion');
                        if (desc) standardizeInput(desc);

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


    /* ─────────────────────────────────────────────────────────── */
    function initializeEditFileModal() {
        const btn = document.getElementById('openEditFileModal');
        const modal = document.getElementById('editFileModal');
        if (!btn || !modal) { return; }          // no es ADMIN

        const inputReal = document.getElementById('edit_archivo_adjunto');
        const flagDelete = document.getElementById('edit_delete_archivo');
        const inputModal = document.getElementById('editFileModalInput');
        const btnClose = modal.querySelector('.close');
        const btnOK = document.getElementById('editConfirmFileButton');
        const content = modal.querySelector('.modal-content');

        /* helper animado */
        const cerrar = () => {
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            content.addEventListener('animationend', function h() {
                modal.style.display = 'none';
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');
                content.removeEventListener('animationend', h);
            });
        };

        /* 1 · abrir modal (creamos/recargamos plugin con preview) */
        btn.onclick = () => {
            const urlActual = btn.dataset.currentFile || '';
            const opciones = buildFileInputOpts({ urlActual, allowZoom: true });

            if ($(inputModal).data('fileinput')) {
                // Ya existe → refrescamos (sin duplicar)
                $(inputModal).fileinput('refresh', opciones);
            } else {
                // Primera vez
                $(inputModal).fileinput(opciones);
            }

            // reseteamos flags
            flagDelete.value = '0';

            $(inputModal)
                .off('filecleared fileselect')        // limpiamos antiguos handlers
                .on('filecleared', () => flagDelete.value = '1')
                .on('fileselect', () => flagDelete.value = '0');

            modal.style.display = 'block';
        };


        /* 2 · cerrar (X o click fuera) */
        btnClose.onclick = cerrar;
        modal.onclick = (e) => { if (e.target === modal) cerrar(); };

        /* 3 · Confirmar: aplicar el cambio al input real y refrescar su plugin */
        btnOK.onclick = () => {

            const $real = $('#edit_archivo_adjunto');              // plugin del form

            /* --- 1. borrar --- */
            if (flagDelete.value === '1' && !inputModal.files.length) {
                // ⇒ sólo borrar
                $real.fileinput('clear');          // quita preview y lanza filecleared
                cerrar();
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'success',
                    text: 'Archivo eliminado.'
                });
                return;
            }

            /* --- 2. reemplazar --- */
            if (inputModal.files.length) {
                flagDelete.value = '0';            // anulamos el borrado
                const nuevoFile = inputModal.files[0];

                /* asignamos el FileList al input REAL (no importa que sea hidden) */
                const dt = new DataTransfer();
                dt.items.add(nuevoFile);
                inputReal.files = dt.files;

                /* refrescamos el plugin del input real con la nueva preview */
                if ($real.data('fileinput')) { $real.fileinput('destroy'); }

                $real.fileinput(buildFileInputOpts({
                    urlActual: URL.createObjectURL(nuevoFile),
                    allowZoom: true
                }))
                    .on('filecleared', () => { flagDelete.value = '1'; });

                cerrar();
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'success',
                    text: 'Archivo reemplazado.'
                });
                return;
            }

            /* --- 3. ni borró ni subió --- */
            Swal.fire({ icon: 'error', text: 'Seleccione un archivo o elimine el actual.' });
        };

    }

    function buildFileInputOpts({ urlActual = '' } = {}) {

        /* 1 ▸ datos del archivo (si existe) -------------------------------- */
        const tieneArchivo = !!urlActual;
        const ext = urlActual.split('.').pop().toLowerCase();
        const esImg = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
        const esPDF = ext === 'pdf';
        const fileType = esImg ? 'image' : esPDF ? 'pdf' : 'other';

        const preview = tieneArchivo ? [urlActual] : [];
        const previewConfig = tieneArchivo ? [{
            caption: urlActual.split('/').pop(),
            key: 1,
            type: fileType,
            filetype: esPDF ? 'application/pdf' : undefined,
            downloadUrl: urlActual,
            frameClass: 'bnup-edit-frame'
        }] : [];

        /* 2 ▸ configuración del plugin ------------------------------------ */
        return {
            /* apariencia general */
            showUpload: false,
            showRemove: true,          // ⟵ sin botón “Eliminar” (trash)
            showPreview: true,
            showCaption: false,
            browseLabel: '<span class="material-symbols-outlined bell">upload_file</span> Seleccionar archivo',
            removeLabel: '<span class="material-symbols-outlined bell">delete</span> Eliminar',
            mainClass: 'input-group-sm',
            dropZoneTitle: 'Arrastra y suelta los archivos aquí',

            /* acciones por thumbnail (todo OFF) */
            fileActionSettings: {
                showRemove: false,
                showUpload: false,
                showZoom: false,    // ⟵ sin icono de lupa
                showDrag: false,
                showDelete: false,
                showDownload: false
            },

            /* sin plantilla de modal-zoom */
            layoutTemplates: {
                close: '', indicator: '', actionCancel: '', actionDelete: '', modal: ''
            },

            /* botones dentro del modal zoom (no se usarán, pero los limpiamos) */
            previewZoomButtonIcons: {
                prev: '', next: '', rotate: '', toggleheader: '',
                fullscreen: '', borderless: '', close: ''
            },

            /* previews dinámicas */
            overwriteInitial: true,
            initialPreview: preview,
            initialPreviewConfig: previewConfig,
            initialPreviewAsData: true,
            initialPreviewFileType: fileType,

            /* icono grande para PDFs (igual estilo que usabas) */
            preferIconicPreview: true,
            previewFileIconSettings: {
                'pdf': '<span class="material-symbols-outlined kv-file-pdf" style="font-size:100px;color:red;">picture_as_pdf</span>'
            },
            previewFileExtSettings: {
                'pdf': ext => ext.match(/(pdf)$/i)
            }
        };
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
            browseLabel: '<span class="material-symbols-outlined bell">upload_file</span> Seleccionar archivo',
            removeLabel: '<span class="material-symbols-outlined bell">delete</span> Eliminar',
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

        $(document).ready(function () {
            $("#archivo_adjunto_salida").fileinput({
                uploadUrl: "/bnup/upload_salida/",
                deleteUrl: '/bnup/delete_file/',
                showUpload: false,
                showRemove: true,
                showPreview: true,
                showCaption: false,
                browseLabel: '<span class="material-symbols-outlined bell">upload_file</span> Seleccionar archivo',
                removeLabel: '<span class="material-symbols-outlined bell">delete</span> Eliminar',
                mainClass: 'input-group-sm',
                dropZoneTitle: 'Arrastra y suelta los archivos aquí',
                fileActionSettings: {
                    showRemove: false,
                    showUpload: false,
                    showZoom: false,
                    showDrag: false,
                    showDelete: false,
                    zoomIcon: '<span class="material-symbols-outlined" style="color: white;">zoom_in</span>',
                    showZoom: function (config) {
                        return (config.type === 'pdf' || config.type === 'image');
                    }
                },
                layoutTemplates: {
                    close: '',
                    indicator: '',
                    actionCancel: '',
                    modal: '<div class="modal-dialog modal-lg{rtl}" role="document">\n' +
                        '  <div class="modal-content animate__animated animate__bounceIn">\n' +
                        '    <div class="modal-header kv-zoom-header">\n' +
                        '      <h6 class="modal-title kv-zoom-title" id="kvFileinputModalLabel"><span class="kv-zoom-caption"></span> <span class="kv-zoom-size"></span></h6>\n' +
                        '      <span class="close"><span class="material-symbols-outlined" style="color: #E73C45; font-size: 40px;">close</span></span>' +
                        '    </div>\n' +
                        '    <div class="kv-zoom-body file-zoom-content {zoomFrameClass}"></div>\n' +
                        '    <div class="kv-zoom-description"></div>\n' +
                        '  </div>\n' +
                        '</div>\n'
                },
                previewZoomButtonIcons: {
                    prev: '',
                    next: '',
                    rotate: '',
                    toggleheader: '',
                    fullscreen: '',
                    borderless: '',
                    close: ''
                }
            });

            // SOLUCIÓN: Sincronizar el archivo arrastrado con el input real del formulario
            $('#archivo_adjunto_salida').on('fileloaded', function (event, file) {
                // Forzar que el archivo cargado se asigne al campo real del formulario
                const fileInput = document.getElementById('archivo_adjunto_salida');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            });

            $(document).on('click', '#kvFileinputModal .kv-zoom-header .close', function (e) {
                e.preventDefault();
                var $modal = $('#kvFileinputModal');
                var $content = $modal.find('.modal-content');
                $content.removeClass('animate__bounceIn').addClass('animate__bounceOut');
                $content.one('animationend', function () {
                    $modal.remove();
                });
            });

            $(document).on('click', '#kvFileinputModal', function (e) {
                if ($(e.target).closest('.modal-content').length === 0) {
                    var $modal = $('#kvFileinputModal');
                    var $content = $modal.find('.modal-content');
                    $content.removeClass('animate__bounceIn').addClass('animate__bounceOut');
                    $content.one('animationend', function () {
                        $modal.remove();
                    });
                }
            });
        });


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

        if (editButton && !['ADMIN', 'SECRETARIA', 'FUNCIONARIO'].includes(tipo_usuario)) {
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
            newGroup.addEventListener('animationend', function () {
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
            group.addEventListener('animationend', function () {
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
        const container = document.getElementById('salidaFuncionariosContainerEdit');
        if (!container) return;
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
            newGroup.addEventListener('animationend', function () {
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
            group.addEventListener('animationend', function () {
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
     * Inicializa la funcionalidad para agregar múltiples funcionarios en el formulario de creación de salidas.
     */
    function initializeMultipleFuncionariosSalida() {
        const container = document.getElementById('salidaFuncionariosContainer');
        if (!container) {
            console.error('No se encontró el contenedor de funcionarios de salida.');
            return;
        }
        // Limpiar el contenedor para evitar duplicados
        container.innerHTML = "";

        // Definir el total de funcionarios y el máximo de selects
        const totalFuncionarios = parseInt(container.getAttribute('data-total-funcionarios'), 10) || 12;
        const maxSelects = totalFuncionarios;

        // Crear el grupo inicial con botón "Añadir"
        const defaultGroup = createSalidaFuncionarioSelectGroup(true);
        container.appendChild(defaultGroup);

        container.addEventListener('click', function handleSalidaFuncionariosClick(event) {
            const addBtn = event.target.closest('.addSalidaFuncionarioBtn');
            const removeBtn = event.target.closest('.removeSalidaFuncionarioBtn');
            if (addBtn) {
                // Usamos el padre directo del botón
                const currentGroup = addBtn.parentElement;
                if (!currentGroup || !currentGroup.classList.contains('funcionario-select-group')) {
                    console.error("No se encontró el grupo de selección ('.funcionario-select-group') para el botón 'Añadir'.");
                    return;
                }
                addSalidaFuncionarioSelect(currentGroup, container, maxSelects);
            } else if (removeBtn) {
                const currentGroup = removeBtn.parentElement;
                if (!currentGroup || !currentGroup.classList.contains('funcionario-select-group')) {
                    console.error("No se encontró el grupo de selección para el botón 'Cancelar'.");
                    return;
                }
                removeSalidaFuncionarioSelect(currentGroup);
            }
        });


        // Función para obtener los funcionarios seleccionados en salidas
        function getSelectedFuncionariosSalida() {
            const selects = container.querySelectorAll('.salidaFuncionarioSelect');
            const selected = [];
            selects.forEach(select => {
                if (select.value) {
                    selected.push(select.value);
                }
            });
            return selected;
        }

        // Actualiza las opciones de cada select para evitar duplicados
        function updateSalidaSelectOptions() {
            const selected = getSelectedFuncionariosSalida();
            const selects = container.querySelectorAll('.salidaFuncionarioSelect');
            selects.forEach(select => {
                const currentValue = select.value;
                const options = select.querySelectorAll('option');
                options.forEach(option => {
                    if (option.value === '') return;
                    option.disabled = (selected.includes(option.value) && option.value !== currentValue);
                });
                if (typeof $(select).select2 === 'function') {
                    $(select).trigger('change.select2');
                }
            });
        }


    }


    function openSalidaModal(solicitudId) {
        // Sólo ciertos roles pueden abrir el modal
        if (!['ADMIN', 'SECRETARIA', 'FUNCIONARIO', 'VISUALIZADOR', 'JEFE']
            .includes(tipo_usuario)) {
            return;
        }

        const salidaModal = document.getElementById('salidaModal');
        const salidaContent = document.getElementById('salidaModalContent');
        const closeBtn = salidaModal?.querySelector('.close');
        const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');
        const salidaSelectAll = document.getElementById('selectAllSalidas');
        const btnEliminarSalidas = document.getElementById('btnEliminarSalidas');


        // Validar elementos esenciales
        if (!salidaModal || !salidaContent || !closeBtn || !tablaSalidasBody) {
            console.error('Elementos del modal de salida no encontrados.');
            return;
        }

        // --- Función para cerrar el modal con animación ---
        function cerrarModal() {
            salidaContent.classList.remove('animate__bounceIn');
            salidaContent.classList.add('animate__bounceOut');
            salidaContent.addEventListener('animationend', () => {
                salidaModal.style.display = 'none';
                salidaContent.classList.remove('animate__bounceOut', 'animate__animated');
                salidaContent.classList.add('animate__bounceIn');
                window._salidaModalAbierto = false;
            }, { once: true });
            salidaModal.removeEventListener('click', onOutsideClick);
        }

        // --- Handler de “clic fuera del contenido” ---
        function onOutsideClick(e) {
            if (e.target === salidaModal) {
                cerrarModal();
            }
        }

        // — Mostrar el modal —
        window._salidaModalAbierto = true;
        salidaContent.classList.remove('animate__bounceOut');
        salidaContent.classList.add('animate__animated', 'animate__bounceIn');
        salidaModal.style.display = 'block';

        // 1) Que el propio fondo del modal no propague clics hacia document
        salidaModal.addEventListener('click', e => e.stopPropagation());

        // 2) Que el contenido tampoco (ya lo tenías)
        salidaContent.addEventListener('click', e => e.stopPropagation());

        // 3) Y por si acaso, que el panel de filtros tampoco propague
        const panel = document.getElementById('filterPanel');
        panel?.addEventListener('click', e => e.stopPropagation());

        // Cerrar con “X”
        closeBtn.onclick = cerrarModal;

        // Cerrar haciendo clic fuera del contenido
        salidaModal.addEventListener('click', onOutsideClick);

        // evita que el botón de filtros pierda su evento
        const btnToggleFilters = document.getElementById('btnToggleFilters');
        btnToggleFilters?.addEventListener('click', e => e.stopPropagation());

        // --- Inicializar contenedor de funcionarios si existe ---
        if (document.getElementById('salidaFuncionariosContainer')) {
            initializeMultipleFuncionariosSalida();
        }

        // --- Mostrar u ocultar controles de ADMIN ---
        const thSelectAll = salidaSelectAll?.closest('th');
        if (thSelectAll) {
            thSelectAll.style.display =
                (['ADMIN', 'FUNCIONARIO', 'SECRETARIA'].includes(tipo_usuario) ? '' : 'none');
        }

        if (btnEliminarSalidas) {
            btnEliminarSalidas.style.display = (tipo_usuario === 'ADMIN' ? '' : 'none');
        }

        // Limpiar contenido previo
        tablaSalidasBody.innerHTML = '';

        // Cargar las salidas existentes mediante AJAX
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
                        row.dataset.salidaId = salida.id;

                        // — nuevo td checkbox sólo ADMIN —
                        if (['ADMIN', 'FUNCIONARIO', 'SECRETARIA'].includes(tipo_usuario)) {
                            const chkTd = document.createElement('td');
                            chkTd.style.textAlign = 'center';
                            const chk = document.createElement('input');
                            chk.type = 'checkbox';
                            chk.className = 'chkEliminarSalida';
                            chk.value = salida.id;         // necesitas incluir `id` en tu JSON
                            chkTd.appendChild(chk);
                            row.appendChild(chkTd);
                        }


                        // Columna Nº Salida
                        const numeroSalidaCell = document.createElement('td');
                        numeroSalidaCell.textContent = salida.numero_salida;
                        row.appendChild(numeroSalidaCell);

                        // Columna Fecha
                        const fechaSalidaCell = document.createElement('td');
                        fechaSalidaCell.textContent = salida.fecha_salida;
                        row.appendChild(fechaSalidaCell);

                        // Columna de Descripción
                        const descripcionCell = document.createElement('td');
                        const descBtn = document.createElement('button');
                        descBtn.className = "buttonLogin buttonPreview";
                        descBtn.style.background = "#1e90ff"; // Ajustado para diferenciar
                        descBtn.style.marginInline = "auto";
                        const iconSpan = document.createElement('span');
                        iconSpan.classList.add('material-symbols-outlined', 'bell');
                        iconSpan.textContent = 'preview';
                        const tooltipDiv = document.createElement('div');
                        tooltipDiv.className = "tooltip";
                        tooltipDiv.textContent = "Ver descripción";
                        descBtn.appendChild(iconSpan);
                        descBtn.appendChild(tooltipDiv);
                        descBtn.onclick = () => {
                            openSalidaDescripcionModal(salida.numero_salida, salida.fecha_salida, salida.descripcion, salida.funcionarios);
                        };
                        descripcionCell.appendChild(descBtn);
                        row.appendChild(descripcionCell);

                        // Columna Archivo adjunto
                        const archivoCell = document.createElement('td');
                        if (salida.archivo_url) {
                            const link = document.createElement('a');
                            link.href = salida.archivo_url;
                            link.target = '_blank';
                            link.setAttribute('aria-label', 'Ver Archivo');
                            link.setAttribute('title', 'Ver Archivo');
                            const button = document.createElement('button');
                            button.className = "buttonLogin buttonPreview";
                            button.style.background = "#f7ea53";
                            button.style.marginInline = "auto";
                            const spanIcon = document.createElement('span');
                            spanIcon.classList.add('material-symbols-outlined', 'bell');
                            spanIcon.textContent = "find_in_page";
                            const tooltipDivArchivo = document.createElement('div');
                            tooltipDivArchivo.className = "tooltip";
                            tooltipDivArchivo.textContent = "Ver archivo de salida";
                            button.appendChild(spanIcon);
                            button.appendChild(tooltipDivArchivo);
                            link.appendChild(button);
                            archivoCell.appendChild(link);
                        } else {
                            archivoCell.textContent = 'No adjunto';
                        }
                        row.appendChild(archivoCell);

                        tablaSalidasBody.appendChild(row);

                    });

                    // Inicializar la paginación de la tabla de salidas
                    // pasamos null como searchInputId para indicar “sin filtros”
                    initializeTable('tablaSalidas', 'paginationSalidas', 8, null);


                    // — capturo todos los checkboxes recién creados —
                    salidaRowCheckboxes = document.querySelectorAll('.chkEliminarSalida');

                    function updateSalidaButtonsState() {
                        const checkedCount = [...salidaRowCheckboxes].filter(c => c.checked).length;

                        // 🔸 des-habilita solo si NO hay selección
                        if (btnEditarSalidas) btnEditarSalidas.disabled = (checkedCount === 0);
                    }
                    salidaRowCheckboxes.forEach(cb => cb.addEventListener('change', updateSalidaButtonsState));

                    if (btnEditarSalidas) {
                        // 1. Limpio cualquier handler acumulado de aperturas anteriores
                        btnEditarSalidas.onclick = null;

                        // 2. Asigno el único handler que necesito
                        btnEditarSalidas.onclick = () => {
                            const checkedRows = [...salidaRowCheckboxes].filter(c => c.checked);

                            if (checkedRows.length !== 1) {
                                const msg =
                                    (salidaSelectAll && salidaSelectAll.checked)
                                        ? 'Solo puede editar un egreso a la vez.'
                                        : 'Seleccione solo un egreso para editar.';

                                Swal.fire({ icon: 'warning', text: msg, heightAuto: false, scrollbarPadding: false });
                                return;
                            }

                            openEditSalidaModal(checkedRows[0].value);
                        };
                    }


                    if (salidaSelectAll) {
                        salidaSelectAll.addEventListener('change', e => {
                            // marcar / desmarcar todas las filas
                            salidaRowCheckboxes.forEach(c => c.checked = e.target.checked);

                            // habilitar / deshabilitar “Eliminar”
                            if (btnEliminarSalidas) {
                                btnEliminarSalidas.disabled = !e.target.checked;
                            }

                            // --- NUEVA LÍNEA ---
                            updateSalidaButtonsState();   // <- habilita “Editar” si procede
                        });
                    }

                    document.querySelector('#tablaSalidas tbody').addEventListener('change', e => {
                        if (!e.target.matches('.chkEliminarSalida')) return;
                        const anyChecked = [...salidaRowCheckboxes].some(c => c.checked);
                        if (btnEliminarSalidas) {
                            btnEliminarSalidas.disabled = !anyChecked;
                        }
                    });

                    // 4) Tu bloque de BORRAR SALIDAS:
                    btnEliminarSalidas?.addEventListener('click', () => {
                        const ids = [...document.querySelectorAll('.chkEliminarSalida')]
                            .filter(c => c.checked)
                            .map(c => c.value);
                        if (!ids.length) return;
                        Swal.fire({
                            icon: 'warning',
                            title: `Eliminar ${ids.length} salidas?`,
                            showCancelButton: true,
                            heightAuto: false,       // evita que SweetAlert ajuste la altura del body
                            scrollbarPadding: false, // ya lo tienes, pero nos aseguramos
                            didOpen: () => {
                                // bloqueo scroll en background
                                document.body.style.overflow = 'hidden';
                            },
                            willClose: () => {
                                // restauro scroll
                                document.body.style.overflow = '';
                            }
                        })
                            .then(res => {
                                if (!res.isConfirmed) return;
                                fetch('/bnup/delete_salidas/', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                                    body: JSON.stringify({ ids }),
                                })
                                    .then(r => r.json())
                                    .then(json => {
                                        if (json.success) {
                                            // 1) Quitar filas del modal
                                            ids.forEach(id => {
                                                document.querySelector(`.chkEliminarSalida[value="${id}"]`)?.closest('tr')?.remove();
                                            });

                                            // 2) CONTAR cuántas quedan para esta solicitud
                                            const remaining = document.querySelectorAll('.chkEliminarSalida').length;
                                            // 3) ACTUALIZAR la celda de "Salidas" en la fila principal
                                            const solicitudId = document.getElementById('solicitud_id').value;
                                            const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                                            if (row) {
                                                const salidasCell = row.querySelector('td:last-child');
                                                if (remaining === 0) {
                                                    // Sin salidas → rojo (pendientes)
                                                    salidasCell.innerHTML = `
                                      <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                          <button class="buttonLogin buttonSubirSalida" style="background: #ed1c24;">
                                            <span class="material-symbols-outlined bell">schedule</span>
                                            <p>|</p>
                                            <span class="material-symbols-outlined bell">upload_file</span>
                                          </button>
                                        </a>
                                        <div class="tooltip">Subir Egresos</div>
                                      </div>
                                    `;
                                                } else {
                                                    // Si quedan ≥1, mantenemos verde
                                                    salidasCell.innerHTML = `
                                      <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                          <button class="buttonLogin buttonPreview" style="background: #17d244;">
                                            <span class="material-symbols-outlined bell">check</span>
                                            <p>|</p>
                                            <span class="material-symbols-outlined bell">find_in_page</span>
                                            <div class="tooltip">Ver archivo de egreso</div>
                                          </button>
                                        </a>
                                      </div>
                                    `;
                                                }
                                            }

                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Eliminadas',
                                                text: 'Los egresos han sido eliminados',
                                                heightAuto: false,
                                                scrollbarPadding: false,
                                                didOpen: () => {
                                                    document.body.style.overflow = 'hidden';
                                                },
                                                willClose: () => {
                                                    document.body.style.overflow = '';
                                                }
                                            });
                                        } else {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: json.error,
                                                heightAuto: false,
                                                scrollbarPadding: false,
                                                didOpen: () => {
                                                    document.body.style.overflow = 'hidden';
                                                },
                                                willClose: () => {
                                                    document.body.style.overflow = '';
                                                }
                                            });
                                        }
                                    });
                            });
                    });


                } else {
                    console.error('Error al obtener los egresos:', data.error);
                }
            })
            .catch(error => {
                console.error('Error al obtener los egresos:', error);
            });

        // Para usuarios con permisos (no visualizadores)
        if (['ADMIN', 'SECRETARIA', 'FUNCIONARIO', 'JEFE'].includes(tipo_usuario)) {
            const solicitudInput = document.getElementById('solicitud_id');
            if (!solicitudInput) {
                console.error('Elemento solicitud_id no encontrado.');
                return;
            }
            solicitudInput.value = solicitudId;

            // Resetear el formulario de salida
            const salidaForm = document.getElementById('salidaForm');
            if (salidaForm) {
                salidaForm.reset();
            }

            // Inicializar o reinicializar el fileinput para el adjunto
            if (document.getElementById('archivo_adjunto_salida')) {
                if ($('#archivo_adjunto_salida').data('fileinput') === undefined) {
                    console.log('Inicializando fileinput para archivo_adjunto_salida');
                    $("#archivo_adjunto_salida").fileinput({
                        uploadUrl: "/bnup/upload_salida/",
                        deleteUrl: '/bnup/delete_file/',
                        showUpload: false,
                        showRemove: true,
                        showPreview: true,
                        showCaption: false,
                        browseLabel: '<span class="material-symbols-outlined bell">upload_file</span> Seleccionar archivo',
                        removeLabel: '<span class="material-symbols-outlined bell">delete</span> Eliminar',
                        mainClass: 'input-group-sm',
                        dropZoneTitle: 'Arrastra y suelta los archivos aquí',
                        fileActionSettings: {
                            showRemove: false,
                            showUpload: false,
                            showZoom: false,
                            showDrag: false,
                            showDelete: false,
                            zoomIcon: '<span class="material-symbols-outlined" style="color: white;">zoom_in</span>',
                            showZoom: function (config) {
                                return (config.type === 'pdf' || config.type === 'image');
                            }
                        },
                        layoutTemplates: {
                            close: '',
                            indicator: '',
                            actionCancel: '',
                            modal: '<div class="modal-dialog modal-lg{rtl}" role="document">\n' +
                                '  <div class="modal-content animate__animated animate__bounceIn">\n' +
                                '    <div class="modal-header kv-zoom-header">\n' +
                                '      <h6 class="modal-title kv-zoom-title" id="kvFileinputModalLabel">\n' +
                                '        <span class="kv-zoom-caption"></span> <span class="kv-zoom-size"></span>\n' +
                                '      </h6>\n' +
                                '      <span class="close"><span class="material-symbols-outlined" style="color: #E73C45; font-size: 40px;">close</span></span>' +
                                '    </div>\n' +
                                '    <div class="kv-zoom-body file-zoom-content {zoomFrameClass}"></div>\n' +
                                '    <div class="kv-zoom-description"></div>\n' +
                                '  </div>\n' +
                                '</div>\n'
                        },
                        previewZoomButtonIcons: {
                            prev: '',
                            next: '',
                            rotate: '',
                            toggleheader: '',
                            fullscreen: '',
                            borderless: '',
                            close: ''
                        }
                    });
                } else {
                    $("#archivo_adjunto_salida").fileinput('clear');
                }
            }

            // Configurar el botón para guardar la salida
            const saveButton = document.getElementById('guardarSalida');
            if (saveButton) {
                saveButton.onclick = (event) => {
                    event.preventDefault();
                    const selects = document.querySelectorAll('.salidaFuncionarioSelect');
                    let funcionarioInvalido = false;
                    selects.forEach(select => {
                        if (select.value === '0') {
                            funcionarioInvalido = true;
                        }
                    });
                    if (funcionarioInvalido) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error en el formulario',
                            text: 'Por favor, seleccione al menos un funcionario antes de enviar.',
                            confirmButtonColor: '#E73C45',
                            heightAuto: false,
                            scrollbarPadding: false
                        });
                        return;
                    }
                    const numeroSalida = document.getElementById('numero_salida').value.trim();
                    const fechaSalida = document.getElementById('fecha_salida').value.trim();
                    const archivoAdjuntoInput = document.getElementById('archivo_adjunto_salida');
                    const archivoAdjunto = archivoAdjuntoInput.files[0];
                    const descripcionSalida = document.getElementById('descripcion_salida') ? document.getElementById('descripcion_salida').value.trim() : '';
                    let funcionariosSalida = [];
                    document.querySelectorAll('.salidaFuncionarioSelect').forEach(select => {
                        if (select.value) {
                            funcionariosSalida.push(select.value);
                        }
                    });
                    if (!numeroSalida || !fechaSalida || !archivoAdjunto) {
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Campos incompletos',
                            text: 'Por favor, complete todos los campos requeridos antes de guardar.',
                            confirmButtonColor: '#E73C45'
                        });
                        return;
                    }
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        title: '¿Desea confirmar el egreso?',
                        text: "Se guardará el egreso con los datos ingresados.",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#4BBFE0',
                        cancelButtonColor: '#E73C45',
                        confirmButtonText: 'Guardar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            const formData = new FormData();
                            formData.append('solicitud_id', solicitudId);
                            formData.append('numero_salida', numeroSalida);
                            formData.append('fecha_salida', fechaSalida);
                            formData.append('archivo_adjunto_salida', archivoAdjunto);
                            formData.append('descripcion_salida', descripcionSalida);
                            funcionariosSalida.forEach(val => {
                                formData.append('funcionarios_salidas', val);
                            });
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
                                        // Actualizar la tabla con la nueva salida
                                        const salida = data.salida;
                                        const row = document.createElement('tr');

                                        // 1) Checkbox sólo ADMIN
                                        if (['ADMIN', 'FUNCIONARIO', 'SECRETARIA'].includes(tipo_usuario)) {
                                            const chkTd = document.createElement('td');
                                            chkTd.style.textAlign = 'center';
                                            const chk = document.createElement('input');
                                            chk.type = 'checkbox';
                                            chk.className = 'chkEliminarSalida';
                                            chk.value = salida.id;
                                            chkTd.appendChild(chk);
                                            row.appendChild(chkTd);
                                        }

                                        const numeroSalidaCell = document.createElement('td');
                                        numeroSalidaCell.textContent = salida.numero_salida;
                                        row.appendChild(numeroSalidaCell);

                                        const fechaSalidaCell = document.createElement('td');
                                        fechaSalidaCell.textContent = salida.fecha_salida;
                                        row.appendChild(fechaSalidaCell);

                                        const descripcionCell = document.createElement('td');
                                        const descBtn = document.createElement('button');
                                        descBtn.className = "buttonLogin buttonPreview";
                                        descBtn.style.background = "#1e90ff";
                                        descBtn.style.marginInline = "auto";
                                        const iconSpan = document.createElement('span');
                                        iconSpan.classList.add('material-symbols-outlined', 'bell');
                                        iconSpan.textContent = 'preview';
                                        const tooltipDiv = document.createElement('div');
                                        tooltipDiv.className = "tooltip";
                                        tooltipDiv.textContent = "Ver descripción";
                                        descBtn.appendChild(iconSpan);
                                        descBtn.appendChild(tooltipDiv);
                                        descBtn.onclick = () => {
                                            openSalidaDescripcionModal(salida.numero_salida, salida.fecha_salida, salida.descripcion, salida.funcionarios);
                                        };
                                        descripcionCell.appendChild(descBtn);
                                        row.appendChild(descripcionCell);

                                        const archivoCell = document.createElement('td');
                                        if (salida.archivo_url) {
                                            const link = document.createElement('a');
                                            link.href = salida.archivo_url;
                                            link.target = '_blank';
                                            link.setAttribute('aria-label', 'Ver Archivo');
                                            link.setAttribute('title', 'Ver Archivo');
                                            const button = document.createElement('button');
                                            button.className = "buttonLogin buttonPreview";
                                            button.style.background = "#f7ea53";
                                            button.style.marginInline = "auto";
                                            const spanIcon = document.createElement('span');
                                            spanIcon.classList.add('material-symbols-outlined', 'bell');
                                            spanIcon.textContent = "find_in_page";
                                            const tooltipDivArchivo = document.createElement('div');
                                            tooltipDivArchivo.className = "tooltip";
                                            tooltipDivArchivo.textContent = "Ver archivo de egreso";
                                            button.appendChild(spanIcon);
                                            button.appendChild(tooltipDivArchivo);
                                            link.appendChild(button);
                                            archivoCell.appendChild(link);
                                        } else {
                                            archivoCell.textContent = 'No adjunto';
                                        }
                                        row.appendChild(archivoCell);

                                        tablaSalidasBody.insertBefore(row, tablaSalidasBody.firstChild);
                                        initializeTable('tablaSalidas', 'paginationSalidas', 8, null);


                                        // no olvides volver a capturar los checkboxes y re-enlazar tus listeners
                                        salidaRowCheckboxes = document.querySelectorAll('.chkEliminarSalida');

                                        // Limpiar los campos del formulario
                                        document.getElementById('numero_salida').value = '';
                                        document.getElementById('fecha_salida').value = '';
                                        archivoAdjuntoInput.value = '';
                                        if (document.getElementById('descripcion_salida')) {
                                            document.getElementById('descripcion_salida').value = '';
                                        }
                                        $(archivoAdjuntoInput).fileinput('clear');

                                        // 1) Actualizar la fila de la tabla principal:
                                        updateTableRow(solicitudId);

                                        // 2) Opcionalmente, recontar el número de salidas en el modal
                                        //    y habilitar/deshabilitar “Eliminar” si es necesario:
                                        if (salidaSelectAll) {
                                            salidaSelectAll.addEventListener('change', e => {
                                                // marcar / desmarcar todas las filas
                                                salidaRowCheckboxes.forEach(c => c.checked = e.target.checked);

                                                // habilitar / deshabilitar “Eliminar”
                                                if (btnEliminarSalidas) {
                                                    btnEliminarSalidas.disabled = !e.target.checked;
                                                }

                                                // --- NUEVA LÍNEA ---
                                                updateSalidaButtonsState();   // <- habilita “Editar” si procede
                                            });
                                        }

                                        Swal.fire({
                                            heightAuto: false,
                                            scrollbarPadding: false,
                                            icon: 'success',
                                            title: 'Egreso creado',
                                            text: 'El egreso ha sido registrado correctamente.',
                                            showConfirmButton: false,
                                            timer: 2000
                                        });
                                    } else {
                                        Swal.fire({
                                            heightAuto: false,
                                            scrollbarPadding: false,
                                            icon: 'error',
                                            title: 'Error',
                                            text: data.error || 'Ha ocurrido un error al crear el egreso.'
                                        });
                                    }
                                })
                                .catch(error => {
                                    console.error('Error al crear el egreso:', error);
                                    Swal.fire({
                                        heightAuto: false,
                                        scrollbarPadding: false,
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Ha ocurrido un error al crear el egreso.'
                                    });
                                });
                        }
                    });
                };
            } else {
                // Para usuarios 'VISUALIZADOR', ocultar el formulario de salidas
                const salidaFields = document.getElementById('salidaFields');
                if (salidaFields) {
                    salidaFields.style.display = 'none';
                }
            }
        }
    }

    function openEditSalidaModal(salidaId) {

        /* ─────────────────────────── refs básicas ────────────────────────── */
        const modal = document.getElementById('editSalidaModal');
        const content = modal.querySelector('.modal-content');
        const form = document.getElementById('editSalidaForm');
        const closeX = modal.querySelector('.close');

        /* ─────────── limpiar formulario y contenedor de funcionarios ─────── */
        form.reset();
        const contEdit = document.getElementById('salidaFuncionariosContainerEdit');
        if (contEdit) contEdit.innerHTML = '';

        /* ───────────────────── overlay-click para cerrar ─────────────────── */
        let downOnOverlay = false;
        const onMouseDown = e => { downOnOverlay = (e.target === modal); };
        const onMouseUp = e => {
            if (downOnOverlay && e.target === modal) cerrar();
            downOnOverlay = false;
        };
        const cerrar = () => {
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            content.addEventListener('animationend', () => {
                modal.style.display = 'none';
                content.classList.remove('animate__bounceOut');
                modal.removeEventListener('mousedown', onMouseDown);
                modal.removeEventListener('mouseup', onMouseUp);
            }, { once: true });
        };
        modal.addEventListener('mousedown', onMouseDown);
        modal.addEventListener('mouseup', onMouseUp);
        closeX.onclick = cerrar;

        /* ───────────────────────── carga por AJAX ────────────────────────── */
        fetch(`/bnup/edit_salida/?salida_id=${salidaId}`)
            .then(r => r.json())
            .then(json => {

                if (!json.success) { Swal.fire({ icon: 'error', text: json.error }); return; }
                const s = json.data;

                /* ---------- campos básicos ---------- */
                document.getElementById('edit_salida_id').value = s.id;
                const numeroInput = document.getElementById('edit_numero_salida');
                if (numeroInput) numeroInput.value = s.numero_salida;

                const fechaInput = document.getElementById('edit_fecha_salida');
                if (fechaInput) fechaInput.value = s.fecha_salida;

                document.getElementById('edit_descripcion_salida').value = s.descripcion || '';

                /* ─────────────―― FILE – NUEVO BLOQUE ――───────────── */

                /* botón 📎 ⇒ dataset con URL actual */
                const btnFile = document.getElementById('openEditSalidaFileModal');
                if (btnFile) {
                    btnFile.dataset.currentFile = s.archivo_url || '';
                }

                /* input REAL con preview inmediato */
                const $fileReal = $('#edit_archivo_adjunto_salida');
                const flagDel = document.getElementById('edit_delete_archivo_salida');

                if ($fileReal.data('fileinput')) { $fileReal.fileinput('destroy'); }

                $fileReal.fileinput(
                    buildFileInputOpts({ urlActual: s.archivo_url || '' })
                )
                    .on('filecleared', () => { flagDel.value = '1'; })   // marcar borrado
                    .on('fileselect', () => { flagDel.value = '0'; });   // se sube nuevo

                /* ─────────────────────────────────────────────────── */


                /* ---------- guardar ---------- */
                document.getElementById('guardarEdicionSalida').onclick = e => {
                    e.preventDefault();

                    /* normalizar texto */
                    const desc = form.querySelector('#edit_descripcion_salida');
                    if (desc) standardizeInput(desc);

                    const fd = new FormData(form);

                    Swal.fire({
                        title: '¿Guardar cambios?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#4BBFE0',
                        cancelButtonColor: '#E73C45',
                        heightAuto: false,
                        scrollbarPadding: false
                    }).then(res => {
                        if (!res.isConfirmed) return;

                        fetch('/bnup/edit_salida/', {
                            method: 'POST',
                            headers: { 'X-CSRFToken': getCSRFToken() },
                            body: fd
                        })
                            .then(r => r.json())
                            .then(json => {
                                if (json.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: 'Egreso actualizado',
                                        timer: 1500,
                                        showConfirmButton: false,
                                        heightAuto: false,
                                        scrollbarPadding: false
                                    });
                                    updateSalidaRow(json.data);          // modal
                                    updateTableRow(json.data.solicitud_id); // tabla principal
                                    cerrar();
                                } else {
                                    Swal.fire({ icon: 'error', text: json.error });
                                }
                            });
                    });
                };

                /* ---------- select(s) de funcionarios ---------- */
                if (contEdit) {
                    if (s.funcionarios.length) {
                        s.funcionarios.forEach((f, i) => {
                            const grp = window.createSalidaFuncionarioSelectGroup(
                                i === s.funcionarios.length - 1
                            );
                            grp.querySelector('select').value = f.id;
                            contEdit.appendChild(grp);
                        });
                    } else {
                        contEdit.appendChild(
                            window.createSalidaFuncionarioSelectGroup(true)
                        );
                    }

                    const max = parseInt(contEdit.dataset.totalFuncionarios, 10) || 12;
                    contEdit.addEventListener('click', e => {
                        const addBtn = e.target.closest('.addSalidaFuncionarioBtn');
                        const delBtn = e.target.closest('.removeSalidaFuncionarioBtn');
                        if (addBtn) {
                            const g = addBtn.closest('.funcionario-select-group');
                            if (g) addSalidaFuncionarioSelect(g, contEdit, max);
                        }
                        if (delBtn) {
                            const g = delBtn.closest('.funcionario-select-group');
                            if (g) removeSalidaFuncionarioSelect(g);
                        }
                    });
                }

            });

        /* ─────────────────────────── mostrar modal ───────────────────────── */
        content.classList.add('animate__bounceIn');
        modal.style.display = 'block';
    }


    function initializeEditSalidaFileModal() {

        /* ─────────────── refs básicas ─────────────── */
        const btn = document.getElementById('openEditSalidaFileModal');
        const modal = document.getElementById('editSalidaFileModal');
        if (!btn || !modal) return;          // solo ADMIN

        const inputReal = document.getElementById('edit_archivo_adjunto_salida');
        const flagDel = document.getElementById('edit_delete_archivo_salida');
        const inputModal = document.getElementById('editSalidaFileModalInput');

        const btnOK = document.getElementById('editConfirmSalidaFileButton');
        const btnClose = modal.querySelector('.close');
        const content = modal.querySelector('.modal-content');

        /* helper → destruye plugin y elimina wrapper .file-input */
        const resetFileInput = (el) => {
            if ($(el).data('fileinput')) { $(el).fileinput('destroy'); }
            const wrap = el.closest('.file-input');   // contenedor que crea el plugin
            if (wrap) {
                wrap.parentNode.insertBefore(el, wrap); // movemos <input> 1 nivel arriba
                wrap.remove();                          // adiós wrapper + previews viejas
            }
            el.value = '';                              // limpia FileList residual
        };

        /* ═══════════════════ abrir modal ═══════════════════ */
        btn.onclick = () => {
            const url = btn.dataset.currentFile || '';

            resetFileInput(inputModal);                 //← limpieza antes de crear

            $(inputModal).fileinput(buildFileInputOpts({ urlActual: url }))
                .on('filecleared', () => { flagDel.value = '1'; })
                .on('fileselect', () => { flagDel.value = '0'; });

            modal.style.display = 'block';
        };

        /* ═══════════════════ cerrar modal ═══════════════════ */
        const cerrar = () => {
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            content.addEventListener('animationend', () => {
                modal.style.display = 'none';
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');

                /* limpieza EXTRA para evitar duplicados en la siguiente apertura */
                resetFileInput(inputModal);
            }, { once: true });
        };

        btnClose.onclick = cerrar;
        modal.onclick = e => { if (e.target === modal) cerrar(); };

        /* ═══════════════════ confirmar ═══════════════════ */
        btnOK.onclick = () => {
            const $real = $('#edit_archivo_adjunto_salida');

            /* solo borrar */
            if (flagDel.value === '1' && !inputModal.files.length) {
                $real.fileinput('clear');
                cerrar();
                Swal.fire({ icon: 'success', text: 'Archivo eliminado.', heightAuto: false, scrollbarPadding: false });
                return;
            }

            /* reemplazo */
            if (inputModal.files.length) {
                flagDel.value = '0';
                const file = inputModal.files[0];

                // pasa el FileList al input REAL
                const dt = new DataTransfer();
                dt.items.add(file);
                inputReal.files = dt.files;

                // refrescamos vista previa del input REAL
                if ($real.data('fileinput')) {
                    $real.fileinput('destroy');
                    const wrap = inputReal.closest('.file-input');
                    if (wrap) {
                        wrap.parentNode.insertBefore(inputReal, wrap);
                        wrap.remove();
                    }
                }
                $real.fileinput(buildFileInputOpts({ urlActual: URL.createObjectURL(file) }))
                    .on('filecleared', () => { flagDel.value = '1'; });

                cerrar();
                Swal.fire({ icon: 'success', text: 'Archivo reemplazado.', heightAuto: false, scrollbarPadding: false });
                return;
            }

            Swal.fire({ icon: 'error', text: 'Seleccione un archivo o elimine el actual.', heightAuto: false, scrollbarPadding: false });
        };
    }



    /**
 * Actualiza la fila de una salida ya mostrada en el modal.
 * @param {{id:number, numero_salida:number, fecha_salida:string,
 *          descripcion:string, funcionarios?:Array}} s
 */
    function updateSalidaRow(s) {
        const row = document.querySelector(
            `#tablaSalidas tbody tr[data-salida-id="${s.id}"]`
        );
        if (!row) return;

        /* 1 ▸ posición de columnas (hay checkbox sólo para ADMIN / FUNCIONARIO) */
        const hasCheckbox = ['ADMIN', 'FUNCIONARIO', 'SECRETARIA'].includes(tipo_usuario);
        const colNumero = hasCheckbox ? 1 : 0;
        const colFecha = colNumero + 1;
        const colDesc = colFecha + 1;
        const colAdj = colDesc + 1;          // ← nueva referencia

        /* 2 ▸ Nº de egreso y fecha */
        row.cells[colNumero].textContent = s.numero_salida;
        row.cells[colFecha].textContent = s.fecha_salida;

        /* 3 ▸ Botón de descripción */
        const btnDesc = row.cells[colDesc].querySelector('button');
        if (btnDesc) {
            btnDesc.onclick = () =>
                openSalidaDescripcionModal(
                    s.numero_salida,
                    s.fecha_salida,
                    s.descripcion,
                    s.funcionarios || []
                );
        }

        /* 4 ▸ Celda de adjunto — se reconstruye según exista archivo */
        const tdAdj = row.cells[colAdj];
        if (s.archivo_url) {
            tdAdj.innerHTML = `
            <a href="${s.archivo_url}" target="_blank" aria-label="Ver Archivo" title="Ver Archivo">
                <button class="buttonLogin buttonPreview" style="background:#f7ea53;margin-inline:auto;">
                    <span class="material-symbols-outlined bell">find_in_page</span>
                    <div class="tooltip">Ver archivo de egreso</div>
                </button>
            </a>`;
        } else {
            tdAdj.textContent = 'No adjunto';
        }
    }
    window.updateSalidaRow = updateSalidaRow;



    function openSalidaDescripcionModal(numeroSalida, fechaSalida, descripcion, funcionarios) {
        const modal = document.getElementById('descripcionSalidaModal');
        if (!modal) { console.error("Modal 'descripcionSalidaModal' no encontrado."); return; }

        const content = modal.querySelector('.modal-content');

        /* ---------- rellenar campos ---------- */
        document.getElementById('salida_numero').textContent = numeroSalida;
        document.getElementById('salida_fecha').textContent = fechaSalida;
        document.getElementById('salida_descripcion').textContent = descripcion || "Sin descripción";

        const lista = document.getElementById('salida_funcionarios');
        if (lista) {
            lista.innerHTML = '';
            if (funcionarios?.length) {
                funcionarios.forEach(f => {
                    const p = document.createElement('p');
                    p.textContent = f.nombre;
                    lista.appendChild(p);
                });
            } else {
                lista.textContent = "No hay funcionarios asignados";
            }
        }

        /* ---------- mostrar con animación ---------- */
        modal.style.display = 'block';
        content.classList.remove('animate__bounceOut');
        content.classList.add('animate__animated', 'animate__bounceIn');

        /* ---------- gestión de cierre ---------- */
        const closeX = modal.querySelector('.close');

        // 1️⃣ Queremos saber si el clic comenzó en el overlay
        let downOnOverlay = false;
        const onMouseDown = e => { downOnOverlay = (e.target === modal); };
        const onMouseUp = e => {
            if (downOnOverlay && e.target === modal) cerrar();   // empezó y terminó fuera
            downOnOverlay = false;
        };

        // 2️⃣ Cerrar con la “X”
        closeX.onclick = cerrar;

        // 3️⃣ Listeners en el overlay
        modal.addEventListener('mousedown', onMouseDown);
        modal.addEventListener('mouseup', onMouseUp);

        function cerrar() {
            // Evita cierres duplicados
            closeX.onclick = null;
            modal.removeEventListener('mousedown', onMouseDown);
            modal.removeEventListener('mouseup', onMouseUp);

            // Animación de salida
            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');
            content.addEventListener('animationend', () => {
                modal.style.display = 'none';
                content.classList.remove('animate__bounceOut', 'animate__animated');
            }, { once: true });
        }
    }

    /* ===========================================================
   UTILIDADES GLOBALES  (cólalas al inicio de bnup_form.js)
   =========================================================== */
    function createAddSalidaButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'addSalidaFuncionarioBtn btn btn-icon';
        btn.style.cssText = 'margin-left:10px;padding:0';
        btn.innerHTML = '<span class="material-symbols-outlined">add</span>';
        return btn;
    }

    function createCancelSalidaButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'removeSalidaFuncionarioBtn btn btn-icon';
        btn.style.cssText = 'margin-left:10px;padding:0';
        btn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
        return btn;
    }

    function createSalidaFuncionarioSelectGroup(isLast = false) {
        const group = document.createElement('div');
        group.className = 'funcionario-select-group';
        group.style.cssText = 'display:flex;align-items:center;margin-top:10px';

        /* <select> */
        const select = document.createElement('select');
        select.name = 'funcionarios_salidas';
        select.className = 'salidaFuncionarioSelect';
        select.style.maxWidth = '20rem';
        select.required = true;

        /* opción “Seleccione” */
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = 'Seleccione';
        select.appendChild(opt);

        /* clonar todas las opciones del elemento oculto */
        document
            .querySelectorAll('#allFuncionariosOptions option')
            .forEach(o => select.appendChild(o.cloneNode(true)));

        group.appendChild(select);
        group.appendChild(isLast ? createAddSalidaButton()
            : createCancelSalidaButton());

        // activar Select2 si existe
        if (typeof $(select).select2 === 'function') {
            $(select).select2({ placeholder: 'Seleccione', allowClear: true, width: '100%' });
        }
        return group;
    }

    function addSalidaFuncionarioSelect(currentGroup, container, maxSelects) {
        if (!currentGroup || !container) return;              // ← salvaguarda

        const selects = container.querySelectorAll('.salidaFuncionarioSelect');
        if (selects.length >= maxSelects) {
            Swal.fire({
                icon: 'warning',
                text: `No puedes agregar más de ${maxSelects} funcionarios.`
            });
            return;
        }

        /* sustituir + por – en el grupo actual */
        currentGroup.querySelector('.addSalidaFuncionarioBtn')?.remove();
        if (!currentGroup.querySelector('.removeSalidaFuncionarioBtn')) {
            currentGroup.appendChild(createCancelSalidaButton());
        }

        /* crear el nuevo grupo al final */
        container.appendChild(createSalidaFuncionarioSelectGroup(true));
    }

    function removeSalidaFuncionarioSelect(group) {
        group.remove();
    }

    /* exponerlas en window por si algún otro script las necesita */
    window.createSalidaFuncionarioSelectGroup = createSalidaFuncionarioSelectGroup;
    window.addSalidaFuncionarioSelect = addSalidaFuncionarioSelect;
    window.removeSalidaFuncionarioSelect = removeSalidaFuncionarioSelect;
    /* =========================================================== */


    /* ------------ el resto de tu código (initialize…, openModal…) -------- */




    function closeSalidaDescripcionModal() {
        const modal = document.getElementById('descripcionSalidaModal');
        if (modal) {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('animate__bounceIn');
            modalContent.classList.add('animate__bounceOut');
            modalContent.addEventListener('animationend', function () {
                modal.style.display = 'none';
                modalContent.classList.remove('animate__animated', 'animate__bounceOut');
            }, { once: true });
        }
    }



    /**
     * Actualiza una fila específica de la tabla con los datos más recientes de la solicitud.
     * @param {string} solicitudId - ID de la solicitud a actualizar.
     */
    function updateTableRow(solicitudId) {
        const bnupData = document.getElementById('bnupData');
        const tipo_usuario = bnupData ? bnupData.getAttribute('data-tipo-usuario') : null;
        // let cellIndex = 0;

        // Ajustar índice si hay checkbox en ADMIN o SECRETARIA
        // if (tipo_usuario === 'ADMIN' || tipo_usuario === 'SECRETARIA') {
        //     cellIndex = 1;
        // }

        // ¿La fila tiene checkbox?
        const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
        const hasCheckbox = row?.querySelector('input.rowCheckbox') !== null;
        let cellIndex = hasCheckbox ? 1 : 0;

        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const sol = data.data;
                    const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                    if (row) {
                        const cells = row.getElementsByTagName('td');

                        // Nº Ingreso
                        cells[cellIndex++].textContent = sol.numero_ingreso;

                        // Fecha Ingreso
                        cells[cellIndex++].textContent = formatDate(sol.fecha_ingreso_au);

                        // NUEVA COLUMNA: Fecha Solicitud  
                        cells[cellIndex++].textContent = sol.fecha_solicitud ? formatDate(sol.fecha_solicitud) : '';

                        // Solicitante (Departamento)
                        cells[cellIndex++].textContent = sol.depto_solicitante_text;

                        // N° Doc
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

                        // Tipo Recepción
                        cells[cellIndex++].textContent = sol.tipo_recepcion_text;

                        // Tipo Solicitud
                        cells[cellIndex++].textContent = sol.tipo_solicitud_text;

                        // Funcionarios Asignados
                        const funcionarios = sol.funcionarios_asignados;
                        const funcionariosList = funcionarios.map(func => func.nombre).join('\n');
                        cells[cellIndex++].textContent = funcionariosList;

                        // Descripción (con llamada al modal, incluyendo la fecha de solicitud)
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
                                'tablaSolicitues')">
                                ${truncateText(sol.descripcion, 20)}
                                ${sol.descripcion.length > 1 ? '<div class="icon-container"><span class="material-symbols-outlined">preview</span></div>' : ''}
                            </div>
                        `;

                        // Entradas
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

                        // Salidas
                        const salidasCell = cells[cellIndex++];
                        if (sol.salidas && sol.salidas.length > 0) {
                            if (sol.tipo_solicitud == 12) {
                                salidasCell.innerHTML = `
                                    <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                            <button class="buttonLogin buttonPreview" style="background: #ffa420;">
                                                <span class="material-symbols-outlined bell">group</span>
                                                <p>|</p>
                                                <span class="material-symbols-outlined bell">find_in_page</span>
                                                <div class="tooltip">Ver archivo de egreso</div>
                                            </button>
                                        </a>
                                    </div>
                                `;
                            } else {
                                salidasCell.innerHTML = `
                                    <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                            <button class="buttonLogin buttonPreview" style="background: #17d244;">
                                                <span class="material-symbols-outlined bell">check</span>
                                                <p>|</p>
                                                <span class="material-symbols-outlined bell">find_in_page</span>
                                                <div class="tooltip">Ver archivo de egreso</div>
                                            </button>
                                        </a>
                                    </div>
                                `;
                            }
                        } else {
                            if (sol.tipo_solicitud == 12) {
                                salidasCell.innerHTML = `
                                    <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                            <button class="buttonLogin buttonSubirSalida" style="background: #ffa420;">
                                                <span class="material-symbols-outlined bell">group</span>
                                                <p>|</p>
                                                <span class="material-symbols-outlined bell">upload_file</span>
                                            </button>
                                        </a>
                                        <div class="tooltip">Subir Egresos</div>
                                    </div>
                                `;
                            } else {
                                salidasCell.innerHTML = `
                                    <div class="icon-container">
                                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitudId})">
                                            <button class="buttonLogin buttonSubirSalida">
                                                <span class="material-symbols-outlined bell">schedule</span>
                                                <p>|</p>
                                                <span class="material-symbols-outlined bell">upload_file</span>
                                            </button>
                                        </a>
                                        <div class="tooltip">Subir Egresos</div>
                                    </div>
                                `;
                            }
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
        const bnupData = document.getElementById('bnupData');
        const tipo_usuario = bnupData ? bnupData.getAttribute('data-tipo-usuario') : null;

        // Si el usuario es ADMIN o SECRETARIA, añadir la celda del checkbox
        if (['ADMIN', 'SECRETARIA', 'FUNCIONARIO'].includes(tipo_usuario)) {
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

        // NUEVA COLUMNA: Fecha Solicitud
        const fechaSolicitudCell = document.createElement('td');
        fechaSolicitudCell.classList.add('fechaTable');
        fechaSolicitudCell.textContent = solicitud.fecha_solicitud ? formatDate(solicitud.fecha_solicitud) : '';
        row.appendChild(fechaSolicitudCell);

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

        // Funcionarios Asignados
        const funcionariosCell = document.createElement('td');
        const funcionarios = solicitud.funcionarios_asignados;
        const funcionariosList = funcionarios.map(func => func.nombre).join('\n');
        funcionariosCell.textContent = funcionariosList;
        row.appendChild(funcionariosCell);

        // Descripción (incluyendo fecha de solicitud en la llamada al modal)
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
                solicitud.fecha_solicitud, // Nuevo parámetro: fecha_solicitud
                'tablaSolicitudes'
            );
        };
        descripcionDiv.innerHTML = `${truncateText(solicitud.descripcion, 20)}`;
        if (solicitud.descripcion.length > 1) {
            descripcionDiv.innerHTML += `
                <div class="icon-container">
                    <span class="material-symbols-outlined">preview</span>
                </div>
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
            if (solicitud.tipo_solicitud == 12) {
                salidasCell.innerHTML = `
                    <div class="icon-container">
                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                            <button class="buttonLogin buttonPreview" style="background: #ffa420;">
                                <span class="material-symbols-outlined bell">group</span>
                                <p>|</p>
                                <span class="material-symbols-outlined bell">find_in_page</span>
                                <div class="tooltip">Ver archivo de egreso</div>
                            </button>
                        </a>
                    </div>
                `;
            } else {
                salidasCell.innerHTML = `
                    <div class="icon-container">
                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                            <button class="buttonLogin buttonPreview" style="background: #17d244;">
                                <span class="material-symbols-outlined bell">check</span>
                                <p>|</p>
                                <span class="material-symbols-outlined bell">find_in_page</span>
                                <div class="tooltip">Ver archivo de egreso</div>
                            </button>
                        </a>
                    </div>
                `;
            }
        } else {
            if (solicitud.tipo_solicitud == 12) {
                salidasCell.innerHTML = `
                    <div class="icon-container">
                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                            <button class="buttonLogin buttonSubirSalida" style="background: #ffa420;">
                                <span class="material-symbols-outlined bell">group</span>
                                <p>|</p>
                                <span class="material-symbols-outlined bell">upload_file</span>
                            </button>
                        </a>
                        <div class="tooltip">Subir Egresos</div>
                    </div>
                `;
            } else {
                salidasCell.innerHTML = `
                    <div class="icon-container">
                        <a href="javascript:void(0);" onclick="openSalidaModal(${solicitud.id})">
                            <button class="buttonLogin buttonSubirSalida">
                                <span class="material-symbols-outlined bell">schedule</span>
                                <p>|</p>
                                <span class="material-symbols-outlined bell">upload_file</span>
                            </button>
                        </a>
                        <div class="tooltip">Subir Egresos</div>
                    </div>
                `;
            }
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
    window.initializeRowSelection = initializeRowSelection;
    window.openSalidaModal = openSalidaModal; // Exponer openSalidaModal
    window.openEditModal = openEditModal;     // Exponer openEditModal
    window.updateTableRow = updateTableRow;   // Exponer updateTableRow
    window.initializeMultipleFuncionariosSalida = initializeMultipleFuncionariosSalida;
    window.openSalidaModal = openSalidaModal;

})();
