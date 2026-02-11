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
        // BNUP ▸ inicialización: dejar el tipo de usuario disponible globalmente
        window.tipo_usuario = tipo_usuario;

        // Referencias a inputs del formulario de ingreso (CREAR)
        const fechaIngresoInput = document.getElementById("fecha_ingreso_au");
        const numeroIngresoInput = document.getElementById("numeroIngreso");

        // Configurar el campo "N° de Ingreso" para que SIEMPRE sea automático
        // y se alimente desde el backend al abrir/cambiar la fecha.
        if (numeroIngresoInput) {
            setupCreateNumeroIngresoAuto();
        }

        // UX de fecha de ingreso (CREAR):
        // - Usa min dinámico según ventana de gracia de 2 semanas.
        // - Rechaza tecleo manual inválido (año anterior fuera de ventana) con revert + alert.
        if (fechaIngresoInput) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const todayIso = today.toISOString().split('T')[0];

            // Ventana de gracia: primeros 14 días del año actual
            const graceStart = new Date(currentYear, 0, 1); // 1 de enero
            const graceEnd = new Date(graceStart.getTime());
            graceEnd.setDate(graceEnd.getDate() + 14); // día 15 excluido

            // Si ya pasó la ventana -> no permitir años anteriores
            // Si aún estamos dentro -> permitir año anterior completo
            if (today >= graceEnd) {
                fechaIngresoInput.min = `${currentYear}-01-01`;
            } else {
                fechaIngresoInput.min = `${currentYear - 1}-01-01`;
            }

            // Guardar la última fecha válida para poder revertir
            if (!fechaIngresoInput.dataset.prevValidDate) {
                // Usa el valor actual o, en su defecto, hoy
                fechaIngresoInput.dataset.prevValidDate = fechaIngresoInput.value || todayIso;
            }

            if (!fechaIngresoInput.dataset.boundCreateFechaRestrict) {
                fechaIngresoInput.addEventListener('change', () => {
                    const valor = fechaIngresoInput.value;
                    if (!valor) return;

                    const ventanaCheck = validateFechaIngresoYearWindow(valor);
                    if (!ventanaCheck.ok) {
                        // Revertir a la última fecha válida (o hoy como fallback)
                        const prev = fechaIngresoInput.dataset.prevValidDate || todayIso;
                        fechaIngresoInput.value = prev;
                        showFechaIngresoInvalidaAlert(ventanaCheck.message, fechaIngresoInput);
                        return;
                    }

                    // Fecha aceptada -> actualizar "última válida"
                    fechaIngresoInput.dataset.prevValidDate = valor;
                });

                fechaIngresoInput.dataset.boundCreateFechaRestrict = '1';
            }
        }

        // Inicializar componentes si el formulario BNUP está presente
        if (document.querySelector('#bnupForm')) {
            updateBNUPFields();
            updateEditBNUPFields();
            initializeNewDeptoFeature();
            initializeTransparenciaActivaDeadline();

            initIngresoFileCard();
            initEditIngresoFileCard();
            initEditSalidaFileCard();

            initializeBNUPFormModal();
            initializeStandardizeInputs();

            // Aplica el SweetAlert + límite 150 a todos los campos de descripción
            if (typeof window.setupDescriptionTips === 'function') {
                window.setupDescriptionTips(document);
            }
            if (typeof window.bindDescriptionTipButtons === 'function') {
                window.bindDescriptionTipButtons(document);
            }

            initializeMultiSelect({
                selectSelector: '#multi_funcionarios_ing',
                containerSelector: '#funcionariosSeleccionados_ing',
                hiddenInputSelector: '#funcionariosHidden_ing',
            });
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

    function resetCreateIngresoForm() {
        const form = document.getElementById('bnupForm');
        if (!form) return;

        // 1) Reset nativo
        form.reset();

        // 2) Forzar selects a la opción "Seleccione"
        ['#tipo_recepcion', '#tipo_solicitud', '#depto_solicitante'].forEach(sel => {
            const el = form.querySelector(sel);
            if (el) el.selectedIndex = 0;
        });

        // 3) Reaplicar visibilidad/estado de campos dependientes de tipo_recepcion
        const recepSel = document.getElementById('tipo_recepcion');
        const memoWrap = document.getElementById('memoFields');
        const correoWrap = document.getElementById('correoFields');
        const memoInput = document.getElementById('num_memo');
        const correoIn = document.getElementById('correoSolicitante');
        if (recepSel && typeof toggleRecepcionFields === 'function') {
            toggleRecepcionFields(recepSel, memoWrap, correoWrap, memoInput, correoIn);
        }

        // 4) Ocultar/limpiar la fecha límite manual (tipos 5 y 16)
        const taWrap = document.getElementById('transparenciaFechaWrapper');
        const taFecha = document.getElementById('fecha_maxima_respuesta');
        if (taWrap && taFecha) {
            taWrap.style.display = 'none';
            taFecha.value = '';
            // siempre posterior a HOY
            const d = new Date(); d.setDate(d.getDate() + 1);
            taFecha.min = d.toISOString().split('T')[0];
        }

        // 5) Multi-select de funcionarios (chips)
        resetFuncionariosIngreso();

        // 6) Limpiar archivo real y UI de cards del modal de archivo
        const realFile = document.getElementById('archivo_adjunto');
        if (realFile) realFile.value = '';
        const list = document.getElementById('fileListContainer');
        if (list) list.innerHTML = '';

        // 7) Reconfigurar el N° de Ingreso automático (siempre bloqueado)
        if (typeof setupCreateNumeroIngresoAuto === 'function') {
            setupCreateNumeroIngresoAuto();
        }
    }


    /**
     * Obtiene desde el backend el próximo número de ingreso para un año dado.
     * Devuelve un número o null si falla.
     */
    async function fetchNextNumeroIngreso(anio) {
        if (!anio) return null;

        try {
            const resp = await fetch(`/bnup/get_next_numero_ingreso/?anio=${encodeURIComponent(anio)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!resp.ok) {
                console.error('Error HTTP al obtener próximo número de ingreso:', resp.status);
                return null;
            }

            const data = await resp.json();
            if (!data || !data.success || typeof data.numero_ingreso === 'undefined') {
                console.error('Respuesta inválida al obtener próximo número de ingreso:', data);
                return null;
            }

            return data.numero_ingreso;
        } catch (err) {
            console.error('Error al obtener próximo número de ingreso:', err);
            return null;
        }
    }

    /**
     * Valida si una fecha de ingreso (ISO YYYY-MM-DD) corresponde a un año
     * anterior al año actual y, en tal caso, si ya expiró la ventana de gracia
     * de 2 semanas del año actual.
     *
     * Devuelve un objeto { ok: boolean, message: string|null }.
     */
    function validateFechaIngresoYearWindow(fechaISO) {
        if (!fechaISO) {
            return { ok: true, message: null };
        }

        const fecha = new Date(fechaISO);
        if (Number.isNaN(fecha.getTime())) {
            // Si la fecha es inválida, dejamos que otras validaciones se encarguen.
            return { ok: true, message: null };
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const ingresoYear = fecha.getFullYear();

        // Solo aplica si la fecha de ingreso es de un año anterior al actual
        if (ingresoYear >= currentYear) {
            return { ok: true, message: null };
        }

        // Inicio del año actual (1 de enero)
        const graceStart = new Date(currentYear, 0, 1); // 0 = enero
        const graceEnd = new Date(graceStart.getTime());
        graceEnd.setDate(graceEnd.getDate() + 14); // fin de la ventana (día 15, excluido)

        if (today >= graceEnd) {
            return {
                ok: false,
                message:
                    "No se permite ingresar solicitudes con fecha de ingreso del año anterior " +
                    "(solo permitido durante las primeras 2 semanas del año actual).",
            };
        }

        return { ok: true, message: null };
    }

    /**
     * Muestra el SweetAlert estándar para fecha de ingreso inválida
     * y devuelve el foco al input de fecha cuando el usuario cierra el alert.
     */
    function showFechaIngresoInvalidaAlert(message, fechaInput) {
        Swal.fire({
            heightAuto: false,
            scrollbarPadding: false,
            icon: 'error',
            title: 'Fecha de ingreso inválida',
            text: message || '',
        }).then(() => {
            if (fechaInput) {
                fechaInput.focus();
            }
        });
    }

    /**
     * Configura el campo de creación "N° de Ingreso" para que:
     * - Siempre esté bloqueado (disabled).
     * - Siempre muestre el próximo número correlativo según el año de la fecha de ingreso.
     * - Envíe el valor mediante un input hidden espejo.
     */
    function setupCreateNumeroIngresoAuto() {
        const numeroInput = document.getElementById('numeroIngreso');
        const fechaInput = document.getElementById('fecha_ingreso_au');
        if (!numeroInput) return;

        // Bloqueo permanente en UI
        numeroInput.setAttribute('disabled', 'disabled');
        numeroInput.style.background = '#f5f5f5';
        numeroInput.style.cursor = 'not-allowed';

        // Asegura espejo hidden para que el valor viaje en el POST
        ensureMirrorHiddenInput(numeroInput);

        const aplicarParaFechaActual = async () => {
            let year = null;

            if (fechaInput && fechaInput.value) {
                year = getYearFromISODate(fechaInput.value);
            }

            // Si no hay fecha, usar HOY y setear el input de fecha
            if (!year) {
                const hoy = new Date();
                const isoHoy = hoy.toISOString().split('T')[0];

                if (fechaInput) {
                    fechaInput.value = isoHoy;
                }

                year = hoy.getFullYear();
            }

            const siguiente = await fetchNextNumeroIngreso(year);
            if (siguiente == null) {
                // Si falla, dejamos el campo vacío; el backend recalculará al guardar.
                numeroInput.value = '';
                ensureMirrorHiddenInput(numeroInput);
                return;
            }

            numeroInput.value = siguiente;
            ensureMirrorHiddenInput(numeroInput);
        };

        // Guardamos helper en el propio input para reusar si hace falta
        numeroInput._aplicarNumeroIngresoAuto = aplicarParaFechaActual;

        // Recalcular cada vez que cambie la fecha de ingreso (pero siempre bloqueado)
        if (fechaInput && !fechaInput.dataset.boundAutoNumeroIngreso) {
            fechaInput.addEventListener('change', () => {
                aplicarParaFechaActual();
            });
            fechaInput.dataset.boundAutoNumeroIngreso = '1';
        }

        // Primera carga
        aplicarParaFechaActual();
    }


    /**
     * Inicializa el modal del formulario BNUP con confirmación de guardado.
     */
    function initializeBNUPFormModal() {
        const modal = document.getElementById('bnupFormModal');
        if (!modal) return;

        // Evita doble inicialización (muy común si cargas contenido por AJAX/menú)
        if (modal.dataset.bnupModalBound === '1') return;
        modal.dataset.bnupModalBound = '1';

        const content = modal.querySelector('.modal-content');
        const btnOpen = document.getElementById('openBNUPFormModal');
        const closeModalButton = modal.querySelector('.close');

        // Botón guardar dentro del modal
        const saveButton = document.getElementById('guardarBNUP');
        const bnupForm = document.getElementById('bnupForm');

        if (!btnOpen || !closeModalButton || !saveButton || !bnupForm) return;

        // ------------------------------------------------------------
        // ✅ Bootstrap SOLO si el HTML es modal Bootstrap real
        // (tu modal custom NO tiene .modal-dialog, por eso fallaba)
        // ------------------------------------------------------------
        const canUseBootstrapModal = (() => {
            try {
                return (
                    !!window.bootstrap &&
                    typeof window.bootstrap.Modal === 'function' &&
                    !!modal.querySelector('.modal-dialog')   // clave: si no existe, NO usar bootstrap
                );
            } catch (e) {
                return false;
            }
        })();

        // ------------------------------------------------------------
        // Limpieza por si antes quedó un backdrop/estado bootstrap colgado
        // (esto arregla el “modal bloqueado”)
        // ------------------------------------------------------------
        function cleanupBootstrapArtifacts() {
            try {
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('padding-right');
                document.body.style.removeProperty('overflow');

                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
            } catch (e) {
                // no-op
            }
        }

        function isCustomVisible() {
            // Tu modal custom se maneja con display block/none
            return modal.style.display === 'block';
        }

        // ------------------------------------------------------------
        // Helper: cerrar modal de forma robusta (Bootstrap real o custom)
        // ------------------------------------------------------------
        function hideBNUPModal({ resetForm = true } = {}) {
            // Siempre limpia residuos bootstrap (por si alguien lo abrió mal antes)
            cleanupBootstrapArtifacts();

            // 1) Si es Bootstrap real → hide()
            if (canUseBootstrapModal) {
                try {
                    const instance = window.bootstrap.Modal.getInstance(modal) || window.bootstrap.Modal.getOrCreateInstance(modal);
                    instance.hide();
                } catch (err) {
                    // fallback a custom
                    modal.style.display = 'none';
                }
            } else {
                // 2) Modal custom → animación + display none
                if (content) {
                    content.classList.add('animate__animated');
                    content.classList.remove('animate__bounceIn');
                    content.classList.add('animate__bounceOut');

                    let closed = false;

                    const finalize = () => {
                        if (closed) return;
                        closed = true;

                        modal.style.display = 'none';
                        content.classList.remove('animate__bounceOut');
                        content.classList.add('animate__bounceIn');
                    };

                    content.addEventListener('animationend', finalize, { once: true });

                    // Fallback por si no dispara animationend
                    setTimeout(finalize, 350);
                } else {
                    modal.style.display = 'none';
                }
            }

            // Reset opcional del formulario (tu comportamiento deseado)
            if (resetForm) {
                try {
                    if (typeof resetCreateIngresoForm === 'function') {
                        resetCreateIngresoForm();
                    } else {
                        bnupForm.reset();
                    }
                } catch (e) {
                    // no-op
                }

                // Limpia multiselect (si existe tu componente)
                try {
                    document.querySelector('#multi_funcionarios_ing')
                        ?.dispatchEvent(new Event('ms:reset'));
                } catch (e) {
                    // no-op
                }
            }
        }

        // ------------------------------------------------------------
        // Helper: abrir modal (Bootstrap real o custom)
        // ------------------------------------------------------------
        function showBNUPModal() {
            // Limpieza por si quedó algo bootstrap colgado
            cleanupBootstrapArtifacts();

            // Reset del formulario al abrir
            try {
                if (typeof resetCreateIngresoForm === 'function') resetCreateIngresoForm();
            } catch (e) { }

            // Tips/UX (si existen)
            try {
                if (window.resetDescriptionTips) {
                    window.resetDescriptionTips(modal, ['#descripcion'], {
                        skipFocus: () => ['ADMIN', 'SECRETARIA'].includes(window.tipo_usuario),
                    });
                }
                if (window.bindDescriptionTipButtons) window.bindDescriptionTipButtons(modal);
            } catch (e) { }

            // Limpia multiselect al abrir
            try {
                document.querySelector('#multi_funcionarios_ing')
                    ?.dispatchEvent(new Event('ms:reset'));
            } catch (e) { }

            // 1) Bootstrap real → show()
            if (canUseBootstrapModal) {
                try {
                    const instance = window.bootstrap.Modal.getInstance(modal) || window.bootstrap.Modal.getOrCreateInstance(modal);
                    instance.show();
                } catch (err) {
                    // fallback custom
                    modal.style.display = 'block';
                }
            } else {
                // 2) Custom → display block
                modal.style.display = 'block';
            }

            if (content) {
                content.classList.add('animate__animated');
                content.classList.add('animate__bounceIn');
                content.classList.remove('animate__bounceOut');
            }
        }

        // ------------------------------------------------------------
        // ✅ Abrir modal
        // ------------------------------------------------------------
        btnOpen.onclick = (e) => {
            e.preventDefault();
            showBNUPModal();
        };

        // ------------------------------------------------------------
        // ✅ Cerrar modal (X)
        // ------------------------------------------------------------
        closeModalButton.onclick = (e) => {
            e.preventDefault();
            hideBNUPModal({ resetForm: true });
        };

        // ------------------------------------------------------------
        // ✅ Cerrar modal (click fuera) SOLO para custom
        // (si fuera bootstrap real, el backdrop lo maneja bootstrap)
        // ------------------------------------------------------------
        modal.addEventListener('click', (event) => {
            if (!canUseBootstrapModal && event.target === modal) {
                hideBNUPModal({ resetForm: true });
            }
        });

        // ------------------------------------------------------------
        // ✅ Cerrar modal con ESC (custom)
        // ------------------------------------------------------------
        document.addEventListener('keydown', (event) => {
            if (!canUseBootstrapModal && event.key === 'Escape' && isCustomVisible()) {
                hideBNUPModal({ resetForm: true });
            }
        });

        // ------------------------------------------------------------
        // ✅ Guardar (POST Ajax + SweetAlert) + CERRAR MODAL
        // ------------------------------------------------------------
        saveButton.onclick = (event) => {
            event.preventDefault();

            // --------------------------
            // CAMPOS IMPORTANTES
            // --------------------------
            const numeroIngresoInput = document.getElementById('numeroIngreso');
            const numeroIngreso = numeroIngresoInput ? numeroIngresoInput.value.trim() : "";

            const archivoAdjuntoInput = document.getElementById('archivo_adjunto');
            const archivoAdjuntoCount = archivoAdjuntoInput ? archivoAdjuntoInput.files.length : 0;

            const fechaIngresoInput = document.getElementById('fecha_ingreso_au');
            const fechaIngresoValor = fechaIngresoInput ? fechaIngresoInput.value : "";

            // --------------------------
            // LÓGICA AÑO 2026 => backend genera número
            // --------------------------
            let requireNumeroIngreso = true;
            if (fechaIngresoValor) {
                const yearIngreso = parseInt(fechaIngresoValor.split('-')[0], 10);
                if (!isNaN(yearIngreso) && yearIngreso >= 2026) {
                    requireNumeroIngreso = false;
                }
            }

            // --------------------------
            // VALIDACIONES
            // --------------------------
            let mensajeError = "";

            if (archivoAdjuntoCount === 0) {
                mensajeError = "Debe adjuntar el archivo de ingreso (PDF).";
            }

            if (requireNumeroIngreso && !numeroIngreso) {
                if (!mensajeError) mensajeError = "Debe ingresar el N° de ingreso.";
            }

            if (mensajeError) {
                Swal.fire({
                    heightAuto: false,
                    scrollbarPadding: false,
                    icon: 'error',
                    title: 'Campos incompletos',
                    text: mensajeError,
                });
                return;
            }

            // --------------------------
            // VALIDACIÓN VENTANA AÑO ANTERIOR (frontend)
            // --------------------------
            const ventanaCheck = validateFechaIngresoYearWindow(fechaIngresoValor);
            if (!ventanaCheck.ok) {
                showFechaIngresoInvalidaAlert(ventanaCheck.message, fechaIngresoInput);
                return;
            }

            // --------------------------
            // VALIDACIÓN DE CORREO (si tipo recepción 2 o 6)
            // --------------------------
            function esEmailValido(str) {
                return /^\S+@\S+\.\S+$/.test(str);
            }

            const tipoRecep = document.getElementById('tipo_recepcion')?.value;
            if (['2', '6'].includes(tipoRecep)) {
                const mail = document.getElementById('correoSolicitante')?.value?.trim() || "";
                if (!mail) {
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Correo requerido',
                        text: 'Debe ingresar un correo.'
                    });
                    return;
                }
                if (!esEmailValido(mail)) {
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Correo inválido',
                        text: 'Ingrese un correo válido.'
                    });
                    return;
                }
            }

            // --------------------------
            // CONFIRMACIÓN SWEETALERT
            // --------------------------
            Swal.fire({
                heightAuto: false,
                scrollbarPadding: false,
                title: '¿Desea confirmar la Solicitud?',
                text: "Se guardará la solicitud junto con el archivo adjunto.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4BBFE0',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'Cancelar',
            }).then((result) => {
                if (!result.isConfirmed) return;

                saveButton.disabled = true;

                const formData = new FormData(bnupForm);

                fetch(bnupForm.action, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCSRFToken() },
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                        if (!data || !data.success) {
                            Swal.fire({
                                heightAuto: false,
                                scrollbarPadding: false,
                                icon: 'error',
                                title: 'Error',
                                text: (data && data.error) ? data.error : 'Ocurrió un error al crear la solicitud.',
                            });
                            return;
                        }

                        // ✅ 1) Agregar fila
                        if (data.solicitud && typeof addTableRow === 'function') {
                            addTableRow(data.solicitud);
                        }

                        // ✅ 2) Refrescar tabla (igual que eliminación)
                        if (typeof window.refreshTableState === 'function') {
                            requestAnimationFrame(() => window.refreshTableState('tablaSolicitudes'));
                        } else if (typeof window.initializeTable === 'function') {
                            requestAnimationFrame(() => window.initializeTable('tablaSolicitudes'));
                        }

                        // ✅ 3) Cerrar modal + reset (AQUÍ queda garantizado)
                        hideBNUPModal({ resetForm: true });

                        // ✅ 4) SweetAlert éxito
                        const num = data.solicitud?.numero_ingreso ?? '';
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'success',
                            title: 'Solicitud creada',
                            text: num ? `Solicitud N° ${num} registrada correctamente.` : 'La solicitud ha sido registrada correctamente.',
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire({
                            heightAuto: false,
                            scrollbarPadding: false,
                            icon: 'error',
                            title: 'Error',
                            text: 'Ocurrió un error al enviar la solicitud.',
                        });
                    })
                    .finally(() => {
                        saveButton.disabled = false;
                    });
            });
        };
    }


    /**
 * ================================
 * Helpers: bloqueo N° ingreso (EDIT)
 * ================================
 */

    // YYYY-MM-DD -> year number
    function getYearFromISODate(isoDate) {
        if (!isoDate || typeof isoDate !== 'string') return null;
        const y = parseInt(isoDate.split('-')[0], 10);
        return Number.isFinite(y) ? y : null;
    }

    // Crea/actualiza el input hidden espejo cuando el input real está disabled
    function ensureMirrorHiddenInput(disabledInputEl) {
        const mirrorId = `${disabledInputEl.id}_mirror`;
        let mirror = document.getElementById(mirrorId);

        if (!mirror) {
            mirror = document.createElement('input');
            mirror.type = 'hidden';
            mirror.id = mirrorId;
            mirror.name = disabledInputEl.name; // "numero_ingreso"
            disabledInputEl.insertAdjacentElement('afterend', mirror);
        }

        mirror.value = disabledInputEl.value ?? '';
    }

    function removeMirrorHiddenInput(disabledInputEl) {
        const mirror = document.getElementById(`${disabledInputEl.id}_mirror`);
        if (mirror) mirror.remove();
    }

    /**
     * Regla de edición:
     * - Si el ingreso se creó con año ORIGINAL >= 2026 (esquema automático),
     *   el N° de Ingreso queda SIEMPRE bloqueado durante la edición,
     *   aunque el usuario cambie la fecha en el modal.
     * - Si el año original < 2026, el campo permanece editable.
     *
     * El año original se pasa explícitamente al llamar a esta función
     * o se toma desde data-original-year en el input.
     */
    function applyEditNumeroIngresoRule(options = {}) {
        const fechaIngresoField = document.getElementById('edit_fecha_ingreso_au');
        const numeroIngresoField = document.getElementById('edit_numeroIngreso');
        if (!fechaIngresoField || !numeroIngresoField) return;

        // Determinar año original del ingreso (no el que el usuario modifique ahora)
        let originalYear = null;

        if (typeof options.originalYear === 'number') {
            originalYear = options.originalYear;
        } else if (numeroIngresoField.dataset.originalYear) {
            const parsed = parseInt(numeroIngresoField.dataset.originalYear, 10);
            originalYear = Number.isFinite(parsed) ? parsed : null;
        } else if (fechaIngresoField.dataset.originalFechaIngreso) {
            originalYear = getYearFromISODate(fechaIngresoField.dataset.originalFechaIngreso);
        }

        const isAuto = (originalYear !== null && originalYear >= 2026);

        if (isAuto) {
            // Bloqueo real: disabled (para que no pueda teclear ni con flechas del number)
            numeroIngresoField.setAttribute('disabled', 'disabled');
            ensureMirrorHiddenInput(numeroIngresoField);
        } else {
            // Editable (ingresos anteriores al esquema automático)
            numeroIngresoField.removeAttribute('disabled');
            removeMirrorHiddenInput(numeroIngresoField);
        }
    }

    /**
     * ================================
     * openEditModal (versión corregida)
     * ================================
     */
    function openEditModal(solicitudId) {
        const editModal = document.getElementById('editBNUPFormModal');
        const content = editModal ? editModal.querySelector('.modal-content') : null;
        const closeModalButton = editModal ? editModal.querySelector('.close') : null;
        const editForm = document.getElementById('editBNUPForm');

        if (!editModal || !content || !closeModalButton || !editForm) {
            console.error('Elementos del modal de edición no encontrados.');
            return;
        }

        // Resetear el formulario antes de cargar nuevos datos
        editForm.reset();

        // =========================
        // Cierre modal (botón X)
        // =========================
        closeModalButton.onclick = () => {
            const selEdit = document.querySelector('#multi_funcionarios_ing_edit');
            if (selEdit) selEdit.dispatchEvent(new Event('ms:reset'));

            content.classList.remove('animate__bounceIn');
            content.classList.add('animate__bounceOut');

            content.addEventListener('animationend', function handleAnimationEnd() {
                editModal.style.display = 'none';
                content.classList.remove('animate__bounceOut');
                content.classList.add('animate__bounceIn');
                content.removeEventListener('animationend', handleAnimationEnd);
            });
        };

        // =========================
        // Cierre modal (click fuera)
        // Evitar duplicar listeners: removemos el anterior si existía
        // =========================
        if (editModal._outsideClickHandler) {
            document.removeEventListener('click', editModal._outsideClickHandler);
        }

        editModal._outsideClickHandler = (event) => {
            if (event.target === editModal) {
                const selEdit = document.querySelector('#multi_funcionarios_ing_edit');
                if (selEdit) selEdit.dispatchEvent(new Event('ms:reset'));

                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__bounceOut');

                content.addEventListener('animationend', function handleAnimationEnd() {
                    editModal.style.display = 'none';
                    content.classList.remove('animate__bounceOut');
                    content.classList.add('animate__bounceIn');
                    content.removeEventListener('animationend', handleAnimationEnd);
                });
            }
        };

        document.addEventListener('click', editModal._outsideClickHandler);

        // =========================
        // Traer datos desde backend
        // =========================
        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    Swal.fire({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudieron cargar los datos para editar.',
                    });
                    return;
                }

                // Rellenar el formulario con los datos obtenidos
                const solicitudIdField = document.getElementById('edit_solicitud_id');
                if (solicitudIdField) solicitudIdField.value = data.data.id;

                const numeroIngresoField = document.getElementById('edit_numeroIngreso');
                if (numeroIngresoField) {
                    numeroIngresoField.value = data.data.numero_ingreso ?? '';
                }

                const fechaIngresoField = document.getElementById('edit_fecha_ingreso_au');
                if (fechaIngresoField) {
                    fechaIngresoField.value = data.data.fecha_ingreso_au ?? '';
                    // Guardar fecha original para la regla de bloqueo
                    fechaIngresoField.dataset.originalFechaIngreso = data.data.fecha_ingreso_au ?? '';

                    // En edición: NO se permite seleccionar fecha de ingreso
                    // de un año anterior al año actual (sin ventana de gracia).
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    fechaIngresoField.min = `${currentYear}-01-01`;

                    if (!fechaIngresoField.dataset.boundYearRestriction) {
                        fechaIngresoField.addEventListener('change', () => {
                            const valor = fechaIngresoField.value;
                            if (!valor) return;

                            const year = getYearFromISODate(valor);
                            if (year === null) return;

                            const nowYear = new Date().getFullYear();
                            if (year < nowYear) {
                                // Revertir a la fecha original o, en su defecto, a hoy
                                const original = fechaIngresoField.dataset.originalFechaIngreso;
                                if (original) {
                                    fechaIngresoField.value = original;
                                } else {
                                    const hoyIso = new Date().toISOString().split('T')[0];
                                    fechaIngresoField.value = hoyIso;
                                }

                                showFechaIngresoInvalidaAlert(
                                    "En edición no se permite establecer una fecha de ingreso de un año anterior al año actual.",
                                    fechaIngresoField
                                );
                            }
                        });
                        fechaIngresoField.dataset.boundYearRestriction = '1';
                    }
                }

                const fechaSolicitudInput = document.getElementById('edit_fecha_solicitud');
                if (fechaSolicitudInput) fechaSolicitudInput.value = data.data.fecha_solicitud ?? '';

                const descripcionField = document.getElementById('edit_descripcion');
                if (descripcionField) descripcionField.value = data.data.descripcion ?? '';

                const tipoRecepcionSelect = document.getElementById('edit_tipo_recepcion');
                if (tipoRecepcionSelect) {
                    tipoRecepcionSelect.value = data.data.tipo_recepcion;
                    updateEditBNUPFields();
                }

                if (['1', '3', '4', '5', '7'].includes(String(data.data.tipo_recepcion))) {
                    const numMemoField = document.getElementById('edit_num_memo');
                    if (numMemoField) numMemoField.value = data.data.numero_memo ?? '';
                } else if (['2', '6'].includes(String(data.data.tipo_recepcion))) {
                    const correoSolicitanteField = document.getElementById('edit_correoSolicitante');
                    if (correoSolicitanteField) correoSolicitanteField.value = data.data.correo_solicitante ?? '';
                }

                const deptoSelect = document.getElementById('edit_depto_solicitante');
                if (deptoSelect) deptoSelect.value = data.data.depto_solicitante;

                const tipoSolicitudSelect = document.getElementById('edit_tipo_solicitud');
                if (tipoSolicitudSelect) tipoSolicitudSelect.value = data.data.tipo_solicitud;

                // Botón preview adjunto
                const btnFile = document.getElementById('openEditFileModal');
                if (btnFile) btnFile.dataset.currentFile = data.data.archivo_adjunto_ingreso_url || '';

                // ✅ APLICAR REGLA DE BLOQUEO BASADA EN EL AÑO ORIGINAL
                const originalYear = getYearFromISODate(data.data.fecha_ingreso_au);
                if (numeroIngresoField) {
                    numeroIngresoField.dataset.originalYear = originalYear != null ? String(originalYear) : '';
                }
                applyEditNumeroIngresoRule({ originalYear });

                // Multi-select funcionarios (tu lógica)
                {
                    const sel = document.querySelector('#multi_funcionarios_ing_edit');
                    const cont = document.querySelector('#funcionariosSeleccionados_ing_edit');
                    const hid = document.querySelector('#funcionariosHidden_ing_edit');

                    if (sel && cont && hid) {
                        if (!sel.dataset.msInited) {
                            initializeMultiSelect({
                                selectSelector: sel,
                                containerSelector: cont,
                                hiddenInputSelector: hid,
                            });
                            sel.dataset.msInited = '1';
                        }

                        const ids = (data.data.funcionarios_asignados || []).map(f => String(f.id));
                        sel.dispatchEvent(new Event('ms:reset'));
                        sel.dispatchEvent(new CustomEvent('ms:set', { detail: { ids } }));
                    }
                }

                // Mostrar modal
                if (window.resetDescriptionTips) window.resetDescriptionTips(editModal, ['#edit_descripcion']);
                if (window.bindDescriptionTipButtons) window.bindDescriptionTipButtons(editModal);

                editModal.style.display = 'block';
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

        // Guardar edición (tu lógica actual se mantiene)
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
                    if (!result.isConfirmed) return;

                    // Normaliza la descripción antes de leer el formulario
                    const desc = editForm.querySelector('#edit_descripcion');
                    if (desc) standardizeInput(desc);

                    // ✅ Importante: si está disabled, applyEditNumeroIngresoRule ya creó el hidden espejo
                    const formData = new FormData(editForm);

                    fetch('/bnup/edit/', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': getCSRFToken() },
                        body: formData
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('Error en la respuesta del servidor');
                            return response.json();
                        })
                        .then(data => {
                            if (!data.success) {
                                Swal.fire({
                                    heightAuto: false,
                                    scrollbarPadding: false,
                                    icon: 'error',
                                    title: 'Error',
                                    text: data.error || 'Ha ocurrido un error al actualizar la solicitud.',
                                });
                                return;
                            }

                            Swal.fire({
                                heightAuto: false,
                                scrollbarPadding: false,
                                icon: 'success',
                                title: 'Solicitud actualizada',
                                text: 'Los cambios han sido guardados correctamente.',
                                showConfirmButton: false,
                                timer: 2000,
                            });

                            // refresca fila en tabla
                            updateTableRow(solicitudId);

                            const selEdit = document.querySelector('#multi_funcionarios_ing_edit');
                            if (selEdit) selEdit.dispatchEvent(new Event('ms:reset'));

                            editModal.style.display = 'none';
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

    function initIngresoFileCard() {
        window.setupFileCardModal({
            openBtn: '#openFileModal',
            modal: '#fileModal',
            list: '#fileListContainer',
            selectBtn: '#selectFileButton',
            clearBtn: '#clearSelectionButton',
            confirmBtn: '#confirmButton',
            modalInput: '#fileModalInput',
            accept: 'application/pdf',
            mode: 'assign',
            real: { input: '#archivo_adjunto' },
            messages: {
                attached: 'Archivo adjuntado correctamente.',
                replaced: 'Archivo reemplazado.',
                removed: 'Archivo eliminado.'
            }
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
        if (!['ADMIN', 'SECRETARIA', 'FUNCIONARIO', 'VISUALIZADOR', 'JEFE'].includes(tipo_usuario)) {
            return;
        }

        const salidaModal = document.getElementById('salidaModal');
        const salidaContent = document.getElementById('salidaModalContent');
        const closeBtn = salidaModal?.querySelector('.close');
        const tablaSalidasBody = document.querySelector('#tablaSalidas tbody');
        const salidaSelectAll = document.getElementById('selectAllSalidas');
        const btnEliminarSalidas = document.getElementById('btnEliminarSalidas');
        const btnEditarSalidas = document.getElementById('btnEditarSalidas'); // <- faltaba
        let salidaRowCheckboxes = []; // <- manejamos estado local

        // --- helpers multi-select de funcionarios (chips) ---
        function setupMultiSelectSalidaOnce() {
            const sel = document.querySelector('#multi_funcionarios_salida');
            const cont = document.querySelector('#funcionariosSeleccionados_salida');
            const hid = document.querySelector('#funcionariosHidden_salida');

            if (sel && cont && hid && !sel.dataset.msInited) {
                initializeMultiSelect({
                    selectSelector: sel,
                    containerSelector: cont,
                    hiddenInputSelector: hid,
                });
                sel.dataset.msInited = '1';
            }
        }

        // (opcional) pre-cargar con los mismos funcionarios asignados al ingreso
        const PRELLENAR_CON_FUNCIONARIOS_INGRESO = true;
        function prefillFuncionariosDesdeIngreso(sid) {
            if (!PRELLENAR_CON_FUNCIONARIOS_INGRESO) return;
            const sel = document.querySelector('#multi_funcionarios_salida');
            if (!sel) return;

            // Limpia antes de sembrar
            sel.dispatchEvent(new Event('ms:reset'));
            fetch(`/bnup/edit/?solicitud_id=${sid}`)
                .then(r => r.ok ? r.json() : Promise.reject('HTTP error'))
                .then(json => {
                    if (!json.success) return;
                    const ids = (json.data.funcionarios_asignados || []).map(f => String(f.id));
                    sel.dispatchEvent(new CustomEvent('ms:set', { detail: { ids } }));
                })
                .catch(() => { /* silencioso */ });
        }

        // Validar elementos esenciales
        if (!salidaModal || !salidaContent || !closeBtn || !tablaSalidasBody) {
            console.error('Elementos del modal de salida no encontrados.');
            return;
        }

        // --- Función para cerrar el modal con animación ---
        function cerrarModal() {
            // Limpia chips al cerrar (que quede impecable)
            document.querySelector('#multi_funcionarios_salida')
                ?.dispatchEvent(new Event('ms:reset'));

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
        if (window.resetDescriptionTips) window.resetDescriptionTips(salidaModal, ['#descripcion_salida']);
        if (window.bindDescriptionTipButtons) window.bindDescriptionTipButtons(salidaModal);
        // En crear SALIDA: para ADMIN y SECRETARIA NO dispares el tip por foco
        if (window.resetDescriptionTips) {
            window.resetDescriptionTips(salidaModal, ['#descripcion_salida'], {
                skipFocus: () => ['ADMIN', 'SECRETARIA'].includes(window.tipo_usuario)
            });
        }
        // Botón/ícono "info" siempre disponible
        if (window.bindDescriptionTipButtons) {
            window.bindDescriptionTipButtons(salidaModal);
        }

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

        // --- Inicializar chips de funcionarios (salida) ---
        setupMultiSelectSalidaOnce();
        // Arranca limpio
        document.querySelector('#multi_funcionarios_salida')
            ?.dispatchEvent(new Event('ms:reset'));
        // (opcional) precargar con responsables del ingreso
        prefillFuncionariosDesdeIngreso(solicitudId);

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
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    console.error('Error al obtener los egresos:', data.error);
                    return;
                }

                data.salidas.forEach(salida => {
                    const row = document.createElement('tr');
                    row.dataset.salidaId = salida.id;

                    // — checkbox sólo con permisos —
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

                    // Nº Salida
                    const numeroSalidaCell = document.createElement('td');
                    numeroSalidaCell.textContent = salida.numero_salida;
                    row.appendChild(numeroSalidaCell);

                    // Fecha
                    const fechaSalidaCell = document.createElement('td');
                    fechaSalidaCell.textContent = salida.fecha_salida;
                    row.appendChild(fechaSalidaCell);

                    // Ver descripción
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

                    // Archivo
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

                    tablaSalidasBody.appendChild(row);
                });

                // Paginación
                initializeTable('tablaSalidas', 'paginationSalidas', 8, null);

                // Checkboxes recién creados
                salidaRowCheckboxes = document.querySelectorAll('.chkEliminarSalida');

                function updateSalidaButtonsState() {
                    const checkedCount = [...salidaRowCheckboxes].filter(c => c.checked).length;
                    if (btnEditarSalidas) btnEditarSalidas.disabled = (checkedCount === 0);
                }
                salidaRowCheckboxes.forEach(cb => cb.addEventListener('change', updateSalidaButtonsState));

                if (btnEditarSalidas) {
                    btnEditarSalidas.onclick = null; // limpiar handlers viejos
                    btnEditarSalidas.onclick = () => {
                        const checkedRows = [...salidaRowCheckboxes].filter(c => c.checked);
                        if (checkedRows.length !== 1) {
                            const msg = (salidaSelectAll && salidaSelectAll.checked)
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
                        // marcar / desmarcar todas
                        salidaRowCheckboxes.forEach(c => c.checked = e.target.checked);
                        // habilitar / deshabilitar “Eliminar”
                        if (btnEliminarSalidas) btnEliminarSalidas.disabled = !e.target.checked;
                        updateSalidaButtonsState();
                    });
                }

                document.querySelector('#tablaSalidas tbody').addEventListener('change', e => {
                    if (!e.target.matches('.chkEliminarSalida')) return;
                    const anyChecked = [...salidaRowCheckboxes].some(c => c.checked);
                    if (btnEliminarSalidas) btnEliminarSalidas.disabled = !anyChecked;
                });

                // BORRAR SALIDAS
                btnEliminarSalidas?.addEventListener('click', () => {
                    const ids = [...document.querySelectorAll('.chkEliminarSalida')]
                        .filter(c => c.checked)
                        .map(c => c.value);
                    if (!ids.length) return;

                    Swal.fire({
                        icon: 'warning',
                        title: `Eliminar ${ids.length} salidas?`,
                        showCancelButton: true,
                        heightAuto: false,
                        scrollbarPadding: false,
                        didOpen: () => { document.body.style.overflow = 'hidden'; },
                        willClose: () => { document.body.style.overflow = ''; }
                    }).then(res => {
                        if (!res.isConfirmed) return;
                        fetch('/bnup/delete_salidas/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
                            body: JSON.stringify({ ids }),
                        })
                            .then(r => r.json())
                            .then(json => {
                                if (!json.success) {
                                    Swal.fire({
                                        icon: 'error', title: 'Error', text: json.error,
                                        heightAuto: false, scrollbarPadding: false,
                                        didOpen: () => { document.body.style.overflow = 'hidden'; },
                                        willClose: () => { document.body.style.overflow = ''; }
                                    });
                                    return;
                                }

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
                    </div>`;
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
                    </div>`;
                                    }
                                }

                                Swal.fire({
                                    icon: 'success', title: 'Eliminadas', text: 'Los egresos han sido eliminados',
                                    heightAuto: false, scrollbarPadding: false,
                                    didOpen: () => { document.body.style.overflow = 'hidden'; },
                                    willClose: () => { document.body.style.overflow = ''; }
                                });
                            });
                    });
                });
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
            if (salidaForm) salidaForm.reset();

            // Cablear (una sola vez) el modal de archivo para EGRESOS (crear)
            initSalidaFileCardOnce();

            // Limpiar selección anterior (si la había)
            // resetSalidaFileSelection();

            // Configurar el botón para guardar la salida
            const saveButton = document.getElementById('guardarSalida');
            if (saveButton) {
                saveButton.onclick = (event) => {
                    event.preventDefault();

                    const numeroSalida = document.getElementById('numero_salida').value.trim();
                    const fechaSalida = document.getElementById('fecha_salida').value.trim();
                    // 1) intenta encontrar el input real por id
                    let archivoAdjuntoInput = document.getElementById('archivo_adjunto_salida');

                    // 2) fallback: si no está por id, búscalo dentro del wrap del modo 'move'
                    if (!archivoAdjuntoInput) {
                        const wrap = document.getElementById('hiddenSalidaFileInput');
                        if (wrap) {
                            archivoAdjuntoInput = wrap.querySelector('input[type="file"]#archivo_adjunto_salida');
                        }
                    }

                    // 3) toma el archivo de forma segura (a prueba de null)
                    const archivoAdjunto = (archivoAdjuntoInput && archivoAdjuntoInput.files && archivoAdjuntoInput.files.length)
                        ? archivoAdjuntoInput.files[0]
                        : null;


                    const descripcionSalida = document.getElementById('descripcion_salida')
                        ? document.getElementById('descripcion_salida').value.trim()
                        : '';

                    // 🔹 leer IDs desde el hidden del multi-select (CSV)
                    const rawIds = (document.getElementById('funcionariosHidden_salida')?.value || '').trim();
                    const funcionariosIds = rawIds ? rawIds.split(',').map(s => s.trim()).filter(Boolean) : [];

                    if (!numeroSalida || !fechaSalida || !archivoAdjunto) {
                        Swal.fire({
                            heightAuto: false, scrollbarPadding: false,
                            icon: 'error', title: 'Campos incompletos',
                            text: 'Por favor, complete todos los campos requeridos antes de guardar.',
                            confirmButtonColor: '#E73C45'
                        });
                        return;
                    }

                    if (!funcionariosIds.length) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Funcionarios',
                            text: 'Debe seleccionar al menos un funcionario.',
                            confirmButtonColor: '#E73C45',
                            heightAuto: false,
                            scrollbarPadding: false
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
                        if (!result.isConfirmed) return;

                        const formData = new FormData();
                        formData.append('solicitud_id', solicitudId);
                        formData.append('numero_salida', numeroSalida);
                        formData.append('fecha_salida', fechaSalida);
                        formData.append('archivo_adjunto_salida', archivoAdjunto);
                        formData.append('descripcion_salida', descripcionSalida);

                        // 🔸 compatibilidad con backend que usa request.POST.getlist('funcionarios_salidas')
                        funcionariosIds.forEach(id => formData.append('funcionarios_salidas', id));

                        fetch('/bnup/create_salida/', {
                            method: 'POST',
                            headers: { 'X-CSRFToken': getCSRFToken() },
                            body: formData,
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (!data.success) {
                                    Swal.fire({
                                        heightAuto: false, scrollbarPadding: false,
                                        icon: 'error', title: 'Error',
                                        text: data.error || 'Ha ocurrido un error al crear el egreso.'
                                    });
                                    return;
                                }

                                // Actualizar la tabla con la nueva salida
                                const salida = data.salida;
                                const row = document.createElement('tr');

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

                                // recapturar checkboxes
                                salidaRowCheckboxes = document.querySelectorAll('.chkEliminarSalida');

                                // Limpiar campos del formulario
                                document.getElementById('numero_salida').value = '';
                                document.getElementById('fecha_salida').value = '';
                                if (document.getElementById('descripcion_salida')) {
                                    document.getElementById('descripcion_salida').value = '';
                                }
                                // limpiar chips
                                document.querySelector('#multi_funcionarios_salida')
                                    ?.dispatchEvent(new Event('ms:reset'));

                                // limpiar adjunto (nuevo flujo con modal)
                                resetSalidaFileSelection();

                                // 1) Actualizar la fila de la tabla principal:
                                updateTableRow(solicitudId);

                                if (salidaSelectAll) {
                                    salidaSelectAll.addEventListener('change', e => {
                                        salidaRowCheckboxes.forEach(c => c.checked = e.target.checked);
                                        if (btnEliminarSalidas) btnEliminarSalidas.disabled = !e.target.checked;
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
                            })
                            .catch(error => {
                                console.error('Error al crear el egreso:', error);
                                Swal.fire({
                                    heightAuto: false, scrollbarPadding: false,
                                    icon: 'error', title: 'Error',
                                    text: 'Ha ocurrido un error al crear el egreso.'
                                });
                            });
                    });
                };
            } else {
                // Para usuarios 'VISUALIZADOR', ocultar el formulario de salidas
                const salidaFields = document.getElementById('salidaFields');
                if (salidaFields) salidaFields.style.display = 'none';
            }
        }
    }

    let _salidaFileModalInited = false;
    function initSalidaFileCardOnce() {
        if (_salidaFileModalInited) return;
        // Asegurar contenedor oculto para el modo 'move'
        if (!document.getElementById('hiddenSalidaFileInput')) {
            const wrap = document.createElement('div');
            wrap.id = 'hiddenSalidaFileInput';
            wrap.style.display = 'none';
            // lo ideal es dentro del formulario de salidas si existe
            const host = document.getElementById('salidaForm') || document.getElementById('salidaModal') || document.body;
            host.appendChild(wrap);
        }

        const api = window.setupFileCardModal({
            openBtn: '#openSalidaFileModal',
            modal: '#salidaFileModal',
            list: '#salidaFileListContainer',
            selectBtn: '#salidaSelectFileButton',
            clearBtn: '#salidaClearSelectionButton',
            confirmBtn: '#salidaConfirmFileButton',
            modalInput: '#salidaFileModalInput',
            accept: 'application/pdf',
            mode: 'assign',                  // <-- CAMBIO AQUI
            real: { input: '#archivo_adjunto_salida' }, // en assign usaremos input directo
            messages: {
                attached: 'Archivo adjuntado correctamente.'
            }
        });

        window.resetSalidaFileSelection = api.reset; // lo sigues usando tras guardar
        _salidaFileModalInited = true;
    }


    // Para limpiar por completo la selección (post-guardar, por ejemplo)
    function resetSalidaFileSelection() {
        const realId = 'archivo_adjunto_salida';
        let realWrap = document.getElementById('hiddenSalidaFileInput');

        // si no existe el wrap, créalo oculto dentro del modal (por seguridad)
        if (!realWrap) {
            const salidaModal = document.getElementById('salidaModal') || document.body;
            realWrap = document.createElement('div');
            realWrap.id = 'hiddenSalidaFileInput';
            realWrap.style.display = 'none';
            salidaModal.appendChild(realWrap);
        }

        // reset del input REAL
        realWrap.querySelector(`#${realId}`)?.remove();
        const newReal = document.createElement('input');
        newReal.type = 'file';
        newReal.id = realId;
        newReal.name = realId;
        newReal.className = 'file';
        realWrap.appendChild(newReal);

        // limpiar la UI del modal
        const list = document.getElementById('salidaFileListContainer');
        if (list) list.innerHTML = '';
    }

    function openEditSalidaModal(salidaId) {
        /* ─────────────────────────── refs básicas ────────────────────────── */
        const modal = document.getElementById('editSalidaModal');
        const content = modal.querySelector('.modal-content');
        const form = document.getElementById('editSalidaForm');
        const closeX = modal.querySelector('.close');

        /* ─────────── limpiar formulario y chips de funcionarios ──────────── */
        form.reset();
        const selMS = document.querySelector('#multi_funcionarios_salida_edit');
        const contMS = document.querySelector('#funcionariosSeleccionados_salida_edit');
        const hidMS = document.querySelector('#funcionariosHidden_salida_edit');
        if (selMS && contMS && hidMS) {
            // Si ya estaba inicializado, dispara reset; si no, se inicializa más abajo
            if (selMS.dataset.msInited === '1') {
                selMS.dispatchEvent(new Event('ms:reset'));
            } else {
                contMS.innerHTML = '';
                hidMS.value = '';
                selMS.querySelectorAll('option').forEach(o => { o.disabled = false; o.selected = false; });
                selMS.selectedIndex = 0;
            }
        }

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

                // Limpia chips al cerrar
                const sel = document.querySelector('#multi_funcionarios_salida_edit');
                if (sel) sel.dispatchEvent(new Event('ms:reset'));

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
                if (!json.success) { Swal.fire({ icon: 'error', text: json.error, heightAuto: false, scrollbarPadding: false }); return; }
                const s = json.data;

                /* ---------- campos básicos ---------- */
                document.getElementById('edit_salida_id').value = s.id;
                const numeroInput = document.getElementById('edit_numero_salida');
                if (numeroInput) numeroInput.value = s.numero_salida;

                const fechaInput = document.getElementById('edit_fecha_salida');
                if (fechaInput) fechaInput.value = s.fecha_salida;

                document.getElementById('edit_descripcion_salida').value = s.descripcion || '';

                /* ─────────────―― FILE – NUEVO BLOQUE ――───────────── */
                /* botón 📎 ⇒ dataset con URL actual (si existe en la vista) */
                const btnFile = document.getElementById('openEditSalidaFileModal');
                if (btnFile) { btnFile.dataset.currentFile = s.archivo_url || ''; }

                /* inputs reales de archivo y flag de borrado (solo existen para ADMIN) */
                const $fileReal = $('#edit_archivo_adjunto_salida');
                const flagDel = document.getElementById('edit_delete_archivo_salida');

                /* Solo inicializamos el plugin si AMBOS existen (vista ADMIN) */
                if ($fileReal.length && flagDel) {
                    // Si ya estaba inicializado, destrúyelo antes de re-inicializar
                    if ($fileReal.data('fileinput')) { $fileReal.fileinput('destroy'); }

                    $fileReal.fileinput(
                        buildFileInputOpts({ urlActual: s.archivo_url || '' })
                    )
                        .on('filecleared', () => { flagDel.value = '1'; }) // marcar borrado
                        .on('fileselect', () => { flagDel.value = '0'; }); // hay archivo nuevo

                    // Asegura el flag en 0 si hay preview inicial
                    flagDel.value = '0';
                }
                /* ─────────────────────────────────────────────────── */


                /* ---------- chips de funcionarios (ADMIN) ---------- */
                if (selMS && contMS && hidMS) {
                    if (selMS.dataset.msInited !== '1') {
                        initializeMultiSelect({
                            selectSelector: selMS,
                            containerSelector: contMS,
                            hiddenInputSelector: hidMS,
                        });
                        selMS.dataset.msInited = '1';
                    }

                    // Limpia y siembra desde el backend
                    selMS.dispatchEvent(new Event('ms:reset'));
                    const ids = (s.funcionarios || []).map(f => String(f.id));
                    selMS.dispatchEvent(new CustomEvent('ms:set', { detail: { ids } }));
                }

                /* ---------- guardar ---------- */
                document.getElementById('guardarEdicionSalida').onclick = e => {
                    e.preventDefault();
                    const desc = form.querySelector('#edit_descripcion_salida');
                    if (desc) standardizeInput(desc);

                    // 🔹 Asegura que el flag vaya en "conservar" salvo que el usuario haya pulsado "quitar"
                    if (flagDel && flagDel.value !== '1') flagDel.value = '0';

                    const fd = new FormData(form);
                    // (el hidden 'funcionarios_salidas' ya queda sincronizado por el módulo)

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
                                    updateSalidaRow(json.data);            // actualiza tabla de salidas en modal
                                    updateTableRow(json.data.solicitud_id); // actualiza fila de la tabla principal
                                    cerrar();
                                } else {
                                    Swal.fire({ icon: 'error', text: json.error, heightAuto: false, scrollbarPadding: false });
                                }
                            });
                    });
                };
            });
        /* ─────────────────────────── mostrar modal ───────────────────────── */
        content.classList.add('animate__bounceIn');
        if (window.resetDescriptionTips) window.resetDescriptionTips(modal, ['#edit_descripcion_salida']);
        if (window.bindDescriptionTipButtons) window.bindDescriptionTipButtons(modal);
        modal.style.display = 'block';
    }

    /* ─────────────────────────────────────────────────────────── */
    /* Utilidad: truncado que conserva inicio y extensión */
    function smartTruncate(filename, max = 60) {
        if (filename.length <= max) return filename;
        const dot = filename.lastIndexOf('.');
        let base = filename, ext = '';
        if (dot > 0 && dot < filename.length - 1) {
            base = filename.slice(0, dot);
            ext = filename.slice(dot);
        }
        const keep = Math.max(5, max - 1 - ext.length);
        const front = Math.ceil(keep * 0.6);
        const back = keep - front;
        return `${base.slice(0, front)}…${base.slice(-back)}${ext}`;
    }

    function initEditIngresoFileCard() {
        window.setupFileCardModal({
            openBtn: '#openEditFileModal',
            modal: '#editFileModal',
            list: '#editFileListContainer',
            selectBtn: '#selectEditFileButton',
            clearBtn: '#clearEditSelectionButton',
            confirmBtn: '#editConfirmFileButton',
            modalInput: '#editFileModalInput',
            accept: 'application/pdf',
            mode: 'assign',
            real: { input: '#edit_archivo_adjunto' },
            getCurrentUrl: () => (document.getElementById('openEditFileModal')?.dataset.currentFile || ''),
            deleteFlag: '#edit_delete_archivo',
            messages: {
                attached: 'Archivo adjuntado correctamente.',
                replaced: 'Archivo reemplazado.',
                removed: 'Archivo eliminado.'
            }
        });
    }

    function initEditSalidaFileCard() {
        window.setupFileCardModal({
            openBtn: '#openEditSalidaFileModal',
            modal: '#editSalidaFileModal',
            list: '#editSalidaFileListContainer',
            selectBtn: '#selectEditSalidaFileButton',
            clearBtn: '#clearEditSalidaSelectionButton',
            confirmBtn: '#editConfirmSalidaFileButton',
            modalInput: '#editSalidaFileModalInput',
            accept: 'application/pdf',
            mode: 'assign',
            real: { input: '#edit_archivo_adjunto_salida' },
            getCurrentUrl: () => (document.getElementById('openEditSalidaFileModal')?.dataset.currentFile || ''),
            deleteFlag: '#edit_delete_archivo_salida',
            messages: {
                attached: 'Archivo adjuntado correctamente.',
                replaced: 'Archivo reemplazado.',
                removed: 'Archivo eliminado.'
            }
        });
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

        // Buscar la fila de la solicitud
        const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
        const hasCheckbox = row?.querySelector('input.rowCheckbox') !== null;
        let cellIndex = hasCheckbox ? 1 : 0;  // si hay checkbox, empezamos en la 2ª celda

        fetch(`/bnup/edit/?solicitud_id=${solicitudId}`)
            .then(response => response.json())
            .then(data => {
                if (!data.success) return;

                const sol = data.data;
                const row = document.querySelector(`tr[data-id="${solicitudId}"]`);
                if (!row) return;

                const cells = row.getElementsByTagName('td');

                /* ========== Nº Ingreso ========== */
                {
                    const container = document.createElement('div');
                    container.classList.add('icon-container');

                    const span = document.createElement('span');
                    span.textContent = sol.numero_ingreso ? sol.numero_ingreso : '';

                    container.appendChild(span);

                    cells[cellIndex].innerHTML = '';
                    cells[cellIndex].appendChild(container);
                    cellIndex++;
                }

                /* ========== Fecha Ingreso ========== */
                {
                    const container = document.createElement('div');
                    container.classList.add('icon-container');

                    const span = document.createElement('span');
                    span.textContent = sol.fecha_ingreso_au ? formatDate(sol.fecha_ingreso_au) : '';

                    container.appendChild(span);

                    cells[cellIndex].innerHTML = '';
                    cells[cellIndex].appendChild(container);
                    cellIndex++;
                }

                /* ========== Fecha Solicitud ========== */
                {
                    const container = document.createElement('div');
                    container.classList.add('icon-container');

                    const span = document.createElement('span');
                    span.textContent = sol.fecha_solicitud ? formatDate(sol.fecha_solicitud) : '';

                    container.appendChild(span);

                    cells[cellIndex].innerHTML = '';
                    cells[cellIndex].appendChild(container);
                    cellIndex++;
                }

                /* ========== Solicitante (Departamento) ========== */
                cells[cellIndex].textContent = sol.depto_solicitante_text || '';
                cellIndex++;

                /* ========== Tipo Recepción ========== */
                cells[cellIndex].textContent = sol.tipo_recepcion_text || '';
                cellIndex++;

                /* ========== N° Doc dentro de icon-container ========== */
                {
                    const container = document.createElement('div');
                    container.classList.add('icon-container');

                    if (sol.numero_memo) {
                        const span = document.createElement('span');
                        span.textContent = sol.numero_memo;
                        container.appendChild(span);
                    } else {
                        container.innerHTML = `
                        <span class="material-symbols-outlined" style="color: #16233E;">
                            do_not_disturb_on_total_silence
                        </span>
                        <div class="tooltip">Sin número de documento</div>
                    `;
                    }

                    cells[cellIndex].innerHTML = '';
                    cells[cellIndex].appendChild(container);
                    cellIndex++;
                }

                /* ========== Tipo Solicitud ========== */
                cells[cellIndex].textContent = sol.tipo_solicitud_text || '';
                cellIndex++;

                /* ========== Funcionarios (preparar display ANTES de usar en descripción) ========== */
                const funcionarios = sol.funcionarios_asignados || [];
                const funcionariosDisplay =
                    sol.funcionarios_display && sol.funcionarios_display.trim()
                        ? sol.funcionarios_display
                        : funcionarios.map(func => func.nombre).join('\n');

                /* ========== Descripción (con icon-container + modal) ========== */
                {
                    const descripcion = sol.descripcion || '';

                    cells[cellIndex].innerHTML = `
                    <div class="descripcion-preview" onclick="openBNUPDescripcionModal(
                        '${escapeHtml(descripcion)}',
                        '${formatDate(sol.fecha_ingreso_au)}',
                        '${sol.numero_ingreso}',
                        '${escapeHtml(sol.correo_solicitante || '')}',
                        '${escapeHtml(sol.depto_solicitante_text || '')}',
                        '${escapeHtml(funcionariosDisplay)}',
                        '${escapeHtml(sol.tipo_recepcion_text || '')}',
                        '${escapeHtml(sol.tipo_solicitud_text || '')}',
                        '${sol.numero_memo || ""}',
                        '${sol.fecha_solicitud || ""}',
                        'tablaSolicitudes'
                    )">
                        ${truncateText(descripcion, 20)}
                        ${descripcion.length > 1
                            ? '<div class="icon-container"><span class="material-symbols-outlined">preview</span></div>'
                            : ''}
                    </div>
                `;
                    cellIndex++;
                }

                /* ========== Funcionarios (celda) ========== */
                cells[cellIndex].textContent = funcionariosDisplay;
                cellIndex++;

                /* ========== Entradas ========== */
                {
                    const entradaCell = cells[cellIndex];

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
                    cellIndex++;
                }

                /* ========== Salidas: rojo / verde / naranjo según tipo y si tiene egresos ========== */
                {
                    const salidasCell = cells[cellIndex];
                    const esConocimiento =
                        sol.tipo_solicitud == 11 || sol.tipo_solicitud == 12;
                    const tieneSalidas =
                        sol.salidas && sol.salidas.length > 0;

                    if (tieneSalidas) {
                        // Botón verde o naranjo para VER egresos
                        if (esConocimiento) {
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
                            </div>`;
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
                            </div>`;
                        }
                    } else {
                        // Sin salidas: botón rojo o naranjo para SUBIR egresos
                        if (esConocimiento) {
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
                            </div>`;
                        } else {
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
                            </div>`;
                        }
                    }
                    cellIndex++;
                }
            })
            .catch(error => {
                console.error('Error al actualizar la fila:', error);
            });
    }


    // === Transparencia / Transparencia Activa (ids 5 y 16): fecha límite manual ===
    function initializeTransparenciaActivaDeadline() {
        const form = document.getElementById('bnupForm');
        const tipoSelect = document.getElementById('tipo_solicitud');
        const wrapper = document.getElementById('transparenciaFechaWrapper');
        const input = document.getElementById('fecha_maxima_respuesta');

        if (!form || !tipoSelect || !wrapper || !input) return;

        // min: siempre posterior a hoy → mañana (según hora local)
        const today = new Date();
        const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const toYmd = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };
        input.min = toYmd(tomorrow);

        const toggle = () => {
            const isManualDeadline =
                tipoSelect.value === '16' || tipoSelect.value === '5';
            wrapper.style.display = isManualDeadline ? 'block' : 'none';
            if (!isManualDeadline) {
                input.value = '';
            }
        };

        tipoSelect.addEventListener('change', toggle);
        toggle();

        form.addEventListener('submit', (e) => {
            if (tipoSelect.value === '16' || tipoSelect.value === '5') {
                if (!input.value) {
                    e.preventDefault();
                    Swal?.fire?.({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Falta la fecha límite',
                        text: 'Para este tipo de solicitud debes indicar una fecha límite posterior a hoy.',
                    }) || alert('Debe seleccionar una fecha límite de respuesta.');
                    return;
                }
                const val = new Date(input.value + 'T00:00:00');
                if (val <= today) {
                    e.preventDefault();
                    Swal?.fire?.({
                        heightAuto: false,
                        scrollbarPadding: false,
                        icon: 'error',
                        title: 'Fecha inválida',
                        text: 'La fecha debe ser posterior a hoy.',
                    }) || alert('La fecha debe ser posterior a hoy.');
                }
            }
        });
    }

    /**
     * Agrega una nueva fila a la tabla de solicitudes con los datos proporcionados.
     * @param {Object} solicitud - Objeto que contiene los datos de la solicitud.
     */
    function addTableRow(solicitud) {
        const sol = solicitud || {};

        const tablaSolicitudesBody = document.querySelector('#tablaSolicitudes tbody');
        if (!tablaSolicitudesBody) {
            console.error('No se encontró el <tbody> de la tabla de solicitudes (#tablaSolicitudes).');
            return;
        }

        // Si existe una fila "no-results" (placeholder), la quitamos al agregar una real.
        const noResultsRow = tablaSolicitudesBody.querySelector('tr.no-results');
        if (noResultsRow) noResultsRow.remove();

        // Crear la nueva fila
        const row = document.createElement('tr');
        row.classList.add('animate__animated');
        // Si quieres animación visual al agregar:
        // row.classList.add('animate__fadeInDown');

        // Atributos del TR tal como tu template
        row.setAttribute('data-id', sol.id ?? '');

        // Estos data-* existen en tu template (para salidas/descripcion):
        // En creación normalmente vienen vacíos. Los dejamos listos igual.
        row.setAttribute('data-salidas', sol.data_salidas ?? ''); // fallback
        row.setAttribute('data-salidas-descripciones', sol.data_salidas_descripciones ?? '');
        row.setAttribute('data-email', sol.correo_solicitante ?? '');

        // Tipo de usuario desde bnupData (igual que tu base)
        const bnupData = document.getElementById('bnupData');
        const tipo_usuario = bnupData ? bnupData.getAttribute('data-tipo-usuario') : null;

        // ==========================================================
        // 1) Checkbox (solo ADMIN / SECRETARIA / FUNCIONARIO)
        // ==========================================================
        if (tipo_usuario === 'ADMIN' || tipo_usuario === 'SECRETARIA' || tipo_usuario === 'FUNCIONARIO') {
            const checkCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('rowCheckbox');
            checkbox.setAttribute('data-id', sol.id ?? '');
            checkCell.appendChild(checkbox);
            row.appendChild(checkCell);
        }

        // ==========================================================
        // 2) Nº Ingreso
        // ==========================================================
        const numIngresoCell = document.createElement('td');
        const numIngresoContainer = document.createElement('div');
        numIngresoContainer.classList.add('icon-container');

        const numIngresoText = document.createElement('span');
        numIngresoText.textContent = (sol.numero_ingreso !== undefined && sol.numero_ingreso !== null) ? sol.numero_ingreso : '';
        numIngresoContainer.appendChild(numIngresoText);
        numIngresoCell.appendChild(numIngresoContainer);
        row.appendChild(numIngresoCell);

        // ==========================================================
        // 3) Fecha Ingreso AU
        // ==========================================================
        const fechaCell = document.createElement('td');
        fechaCell.classList.add('fechaTable');

        const fechaIngresoContainer = document.createElement('div');
        fechaIngresoContainer.classList.add('icon-container');

        const fechaIngresoText = document.createElement('span');
        // formatDate viene en shared.js y devuelve DD/MM/YYYY con "/"
        fechaIngresoText.textContent = sol.fecha_ingreso_au ? formatDate(sol.fecha_ingreso_au) : '';
        fechaIngresoContainer.appendChild(fechaIngresoText);
        fechaCell.appendChild(fechaIngresoContainer);
        row.appendChild(fechaCell);

        // ==========================================================
        // 4) Fecha Solicitud
        // ==========================================================
        const fechaSolicitudCell = document.createElement('td');
        fechaSolicitudCell.classList.add('fechaTable');

        const fechaSolicitudContainer = document.createElement('div');
        fechaSolicitudContainer.classList.add('icon-container');

        const fechaSolicitudText = document.createElement('span');
        fechaSolicitudText.textContent = sol.fecha_solicitud ? formatDate(sol.fecha_solicitud) : '';
        fechaSolicitudContainer.appendChild(fechaSolicitudText);
        fechaSolicitudCell.appendChild(fechaSolicitudContainer);
        row.appendChild(fechaSolicitudCell);

        // ==========================================================
        // 5) Solicitante (Departamento)
        // ==========================================================
        const deptoCell = document.createElement('td');
        deptoCell.textContent = sol.depto_solicitante_text || '';
        row.appendChild(deptoCell);

        // ==========================================================
        // 6) Tipo Recepción
        // ==========================================================
        const recepcionCell = document.createElement('td');
        recepcionCell.textContent = sol.tipo_recepcion_text || '';
        row.appendChild(recepcionCell);

        // ==========================================================
        // 7) N° Doc (numero_memo) con icono si no existe
        // ==========================================================
        const numDocCell = document.createElement('td');
        const numDocContainer = document.createElement('div');
        numDocContainer.classList.add('icon-container');

        const tieneNumDoc = (sol.numero_memo !== undefined && sol.numero_memo !== null && String(sol.numero_memo).trim() !== '');
        if (tieneNumDoc) {
            const numDocText = document.createElement('span');
            numDocText.textContent = sol.numero_memo;
            numDocText.classList.add('num-doc-text');
            numDocContainer.appendChild(numDocText);
        } else {
            // Igual a tu template: icono + tooltip
            numDocContainer.innerHTML = `
            <span class="material-symbols-outlined" style="color: #16233E;">do_not_disturb_on_total_silence</span>
            <div class="tooltip">Sin número de documento</div>
        `;
        }
        numDocCell.appendChild(numDocContainer);
        row.appendChild(numDocCell);

        // ==========================================================
        // 8) Tipo Solicitud
        // ==========================================================
        const tipoSolicitudCell = document.createElement('td');
        tipoSolicitudCell.textContent = sol.tipo_solicitud_text || '';
        row.appendChild(tipoSolicitudCell);

        // ==========================================================
        // 9) Descripción (preview + modal)
        // ==========================================================
        const descripcionCell = document.createElement('td');

        const descripcionDiv = document.createElement('div');
        descripcionDiv.classList.add('descripcion-preview');

        const descripcionCompleta = sol.descripcion || '';
        descripcionDiv.setAttribute('data-fulltext', descripcionCompleta);

        // Texto truncado igual que template (truncatechars:20)
        const truncLen = 20;
        const textoTruncado = (descripcionCompleta.length > truncLen)
            ? (descripcionCompleta.slice(0, truncLen) + '...')
            : descripcionCompleta;

        // Mantener el texto visible dentro del div
        const textoNode = document.createTextNode(textoTruncado);
        descripcionDiv.appendChild(textoNode);

        // Icono "preview" si hay descripción (igual que template: length > 1)
        if (descripcionCompleta && descripcionCompleta.length > 1) {
            const iconWrap = document.createElement('div');
            iconWrap.classList.add('icon-container');
            iconWrap.innerHTML = `<span class="material-symbols-outlined">preview</span>`;
            descripcionDiv.appendChild(iconWrap);
        }

        // Click abre el modal con los mismos parámetros que tu HTML
        descripcionDiv.addEventListener('click', () => {
            try {
                const funcionariosDisplay =
                    sol.funcionarios_display ||
                    (Array.isArray(sol.funcionarios_asignados)
                        ? sol.funcionarios_asignados.map(f => f.nombre).join(', ')
                        : '');

                openBNUPDescripcionModal(
                    descripcionCompleta,
                    sol.fecha_ingreso_au ? formatDate(sol.fecha_ingreso_au) : '',
                    sol.numero_ingreso ?? '',
                    sol.correo_solicitante ?? '',
                    sol.depto_solicitante_text ?? '',
                    funcionariosDisplay,
                    sol.tipo_recepcion_text ?? sol.tipo_recepcion ?? '',
                    sol.tipo_solicitud_text ?? '',
                    (sol.numero_memo ?? ''),
                    sol.fecha_solicitud ? formatDate(sol.fecha_solicitud) : '',
                    'tablaSolicitudes'
                );
            } catch (e) {
                console.error('Error abriendo modal de descripción:', e);
            }
        });

        descripcionCell.appendChild(descripcionDiv);
        row.appendChild(descripcionCell);

        // ==========================================================
        // 10) Funcionario (sección o lista)
        // ==========================================================
        const funcionarioCell = document.createElement('td');

        // Tu backend ya manda funcionarios_display (incluye sección si corresponde)
        if (sol.funcionarios_display && String(sol.funcionarios_display).trim() !== '') {
            funcionarioCell.textContent = sol.funcionarios_display;
        } else if (Array.isArray(sol.funcionarios_asignados) && sol.funcionarios_asignados.length > 0) {
            funcionarioCell.textContent = sol.funcionarios_asignados.map(f => f.nombre).join(', ');
        } else {
            funcionarioCell.innerHTML = '<em>No hay funcionarios asignados</em>';
        }

        row.appendChild(funcionarioCell);

        // ==========================================================
        // 11) Entradas (archivo adjunto ingreso)
        // ==========================================================
        const archivoCell = document.createElement('td');

        if (sol.archivo_adjunto_ingreso_url && String(sol.archivo_adjunto_ingreso_url).trim() !== '') {
            archivoCell.innerHTML = `
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
            archivoCell.innerHTML = `
            <div class="icon-container">
                <span style="color: #E73C45;" class="material-symbols-outlined">scan_delete</span>
                <div class="tooltip">Sin archivo de ingreso</div>
            </div>
        `;
        }

        row.appendChild(archivoCell);

        // ==========================================================
        // 12) Egresos (salidas) - botón subir / ver
        // ==========================================================
        const salidasCell = document.createElement('td');

        // Por defecto, al crear NO hay salidas.
        // Pero dejamos compatibilidad si en el futuro el backend manda algo:
        // - has_salidas (boolean)
        // - salidas_count (number)
        // - salidas (array)
        const tipoSolicitudId = (sol.tipo_solicitud !== undefined && sol.tipo_solicitud !== null)
            ? String(sol.tipo_solicitud)
            : '';

        const esGrupo = (tipoSolicitudId === '11' || tipoSolicitudId === '12');

        const hasSalidas =
            sol.has_salidas === true ||
            (typeof sol.salidas_count === 'number' && sol.salidas_count > 0) ||
            (Array.isArray(sol.salidas) && sol.salidas.length > 0);

        if (hasSalidas) {
            // Ver archivo de egreso (verde check o naranja group)
            if (esGrupo) {
                salidasCell.innerHTML = `
                <div class="icon-container">
                    <a href="javascript:void(0);" onclick="openSalidaModal(${sol.id})">
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
                    <a href="javascript:void(0);" onclick="openSalidaModal(${sol.id})">
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
            // Subir egresos (default)
            if (esGrupo) {
                salidasCell.innerHTML = `
                <div class="icon-container">
                    <a href="javascript:void(0);" onclick="openSalidaModal(${sol.id})">
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
                    <a href="javascript:void(0);" onclick="openSalidaModal(${sol.id})">
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

        // Insertar la nueva fila al inicio de la tabla (igual que tu lógica actual)
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
    window.initIngresoFileCard = initIngresoFileCard;
    window.initializeBNUPFormModal = initializeBNUPFormModal;
    window.initializeRowSelection = initializeRowSelection;
    window.openSalidaModal = openSalidaModal; // Exponer openSalidaModal
    window.openEditModal = openEditModal;     // Exponer openEditModal
    window.updateTableRow = updateTableRow;   // Exponer updateTableRow
    window.initializeMultipleFuncionariosSalida = initializeMultipleFuncionariosSalida;
    window.openSalidaModal = openSalidaModal;

})();
