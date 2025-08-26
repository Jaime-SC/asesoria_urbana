// static/js/egresos_au.js
(function () {
    // 1) Helpers a nivel del IIFE (fuera del listener):
    function setupEgresosDeleteToggle() {
        const table = document.getElementById('tablaEgresosAU');
        const delBtn = document.getElementById('deleteSelectedEgresos');
        if (!table || !delBtn) return;

        const update = () => {
            const anyChecked = !!table.querySelector('tbody .rowCheckbox:checked');
            delBtn.disabled = !anyChecked;
        };

        table.addEventListener('change', (e) => {
            if (e.target.matches('.rowCheckbox') || e.target.matches('.select-all')) {
                update();
            }
        });

        update();
    }

    document.addEventListener('click', async function (event) {
        // 1) Pulsar "Egresos AU"
        const btnEgresos = event.target.closest('#egresosAUButton');
        if (btnEgresos) {
            event.preventDefault();
            const container = document.querySelector('.tableInfor_container > div');
            if (!container) return console.error('Contenedor para tabla no encontrado.');
            if (typeof showLoader === 'function') showLoader();

            try {
                const r = await fetch('/bnup/egresos_au_fragment/');
                if (!r.ok) throw new Error();
                const html = await r.text();
                container.innerHTML = html;
                initializeTable('tablaEgresosAU', 'paginationEgresosAU', 10, null);
                setupFiltersEgresosAU('tablaEgresosAU', 'searchEgresosAU');

                setupRowSelection('tablaEgresosAU');
                setupEgresosDeleteToggle();

                // sustituimos botones
                btnEgresos.outerHTML = `
          <button id="backToBNUP" class="btn-back">
            <span class="material-symbols-outlined">arrow_back</span>
            Volver a Solicitudes
          </button>`;
                const btnIngresar = document.getElementById('openBNUPFormModal');
                if (btnIngresar) {
                    btnIngresar.outerHTML = `
            <button id="openEgresoFormModal" class="btn-stats btnAddEgreso"
                    style="background-color:#4BBFE0;justify-content:flex-start;width:150px;">
              <span class="material-symbols-outlined">note_add</span>
              Crear Egreso
            </button>`;
                }
                const btnDeleteBNUP = document.getElementById('deleteSelected');
                if (btnDeleteBNUP) {
                    btnDeleteBNUP.outerHTML = `
                        <button id="deleteSelectedEgresos"
                                class="btn-stats btnDelEgresoAU"
                                style="background-color:#E73C45;justify-content:flex-start;width:150px;"
                                disabled>
                        <span class="material-symbols-outlined">delete</span> Eliminar
                        </button>`;
                }

                // dentro del bloque que arma los botones al pulsar "#egresosAUButton"
                const toolbar = document.querySelector('.accionesBNUP') || document; // ajústalo a tu contenedor

                // Si existe el de BNUP, reemplázalo; si no, lo insertas donde corresponda:
                const editMarkup = `
                    <button id="editSelectedEgresos"
                            class="btn-stats btnEditEgresoAU"
                            style="justify-content:flex-start;width:150px;"
                            disabled>
                        <span class="material-symbols-outlined">edit</span> Editar
                    </button>`;

                // 1) Si existe el botón de editar de BNUP, lo reemplazo
                const btnEditBNUP = document.getElementById('editSelected');
                if (btnEditBNUP) {
                    btnEditBNUP.outerHTML = editMarkup;
                } else if (!document.getElementById('editSelectedEgresos')) {
                    // 2) Si no existe, lo inserto cerca de los otros controles
                    const toolbar = document.querySelector('.accionesBNUP');
                    if (toolbar) {
                        toolbar.insertAdjacentHTML('beforeend', editMarkup);
                    } else {
                        const anchor = document.getElementById('deleteSelectedEgresos') || document.getElementById('openEgresoFormModal');
                        anchor?.insertAdjacentHTML('afterend', editMarkup);
                    }
                }

            } catch {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar egresos AU.' });
            } finally {
                if (typeof hideLoader === 'function') hideLoader();
            }

            return;
        }

        // 2) Pulsar "Crear Egreso"
        if (event.target.closest('#openEgresoFormModal')) {
            event.preventDefault();
            const overlay = document.getElementById('egresoModalOverlay');
            const content = overlay.querySelector('.modal-content');

            // 2.1 fetch formulario
            const resp = await fetch('/bnup/egresos_au_create/');
            if (!resp.ok) {
                return Swal.fire('Error', 'No se pudo cargar el formulario', 'error');
            }
            content.innerHTML = await resp.text();

            // ──────────────────────────────────────────────────────────────
            // Inicializa multi-select reutilizable (define chips animados) 
            initializeMultiSelect({
                selectSelector: '#multi_funcionarios',
                containerSelector: '#funcionariosSeleccionados',
                hiddenInputSelector: '#funcionariosHidden',
                // animationIn:  'animate__fadeIn',     // <- opcionales
                // animationOut: 'animate__fadeOut',
            });
            // ──────────────────────────────────────────────────────────────

            //  ⬇️  formatear los inputs que lleven la clase
            initializeStandardizeInputs(content);
            const inputArchivo = content.querySelector('#archivo_adjunto');
            initializeFileInput(inputArchivo);
            // Subir respuesta
            initializeFileInput('#archivo_respuesta');

            // validación número único
            const inputNumero = content.querySelector('#numero_egreso');
            const numeroError = content.querySelector('#error_numero');
            let numeroValido = null;
            async function validarNumeroCreate(num) {
                if (!num) return null;
                const r = await fetch(`/bnup/egresos_au/validate_numero/?numero=${encodeURIComponent(num)}`);
                if (!r.ok) return null;
                const { exists } = await r.json();      // exists => ya hay ACTIVO
                return !exists;                         // true => válido
            }

            inputNumero.addEventListener('blur', async () => {
                const ok = await validarNumeroCreate(inputNumero.value.trim());
                numeroError.style.display = ok === false ? 'block' : 'none';
            });

            // funciones de animación
            function cerrarFormModal() {
                // quitar listener
                spanX.onclick = null;
                // anim out
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__animated', 'animate__bounceOut');
                content.addEventListener('animationend', () => {
                    overlay.style.display = 'none';
                    content.classList.remove('animate__animated', 'animate__bounceOut');
                }, { once: true });
            }

            // mostrar + anim in
            overlay.style.display = 'flex';
            content.classList.add('animate__animated', 'animate__bounceIn');

            // bind cierre
            const spanX = content.querySelector('.close');
            if (spanX) spanX.onclick = cerrarFormModal;

            // submit AJAX (reemplaza TODO este bloque)
            const form = content.querySelector('form');
            form.onsubmit = async (evt) => {
                evt.preventDefault();

                // Evitar dobles envíos
                if (form.dataset.sending === "1") return;

                // 1) Validación del número (por si no hubo blur)
                if (numeroValido === null) {
                    numeroValido = await validarNumeroCreate(inputNumero.value.trim());
                }
                if (numeroValido === false) {
                    inputNumero.focus();
                    return Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'El número de egreso ya existe en un registro activo.',
                        heightAuto: false,
                        scrollbarPadding: false
                    });
                }

                // 2) Recoger valores para la previa
                const numero = (content.querySelector('#numero_egreso')?.value || '').trim();
                const fechaISO = (content.querySelector('#fecha_egreso')?.value || '').trim();
                const descripcion = (content.querySelector('#descripcion')?.value || '').trim();
                const archivo = content.querySelector('#archivo_adjunto')?.files?.[0]?.name || '—';

                const selDest = content.querySelector('#destinatario');
                const destinatario = (selDest && selDest.value)
                    ? selDest.options[selDest.selectedIndex].text
                    : '—';

                // Nombres de funcionarios (robusto usando hidden + select)
                const selFunc = content.querySelector('#multi_funcionarios');
                const hiddenIds = content.querySelector('#funcionariosHidden');

                let nombresFuncionarios = [];
                if (hiddenIds && selFunc) {
                    const ids = (hiddenIds.value || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                    // Mapear IDs -> texto del <option>
                    nombresFuncionarios = ids
                        .map(id => selFunc.querySelector(`option[value="${id}"]`)?.textContent?.trim())
                        .filter(Boolean);

                    // Fallback: si por alguna razón el hidden está vacío, intenta por selectedOptions
                    if (nombresFuncionarios.length === 0) {
                        nombresFuncionarios = Array.from(selFunc.selectedOptions || [])
                            .map(o => o.textContent.trim())
                            .filter(Boolean);
                    }

                    // Segundo fallback: intenta leer chips con varios selectores posibles
                    if (nombresFuncionarios.length === 0) {
                        nombresFuncionarios = Array.from(
                            content.querySelectorAll('#funcionariosSeleccionados .chip-text, \
                                #funcionariosSeleccionados .chip__text, \
                                #funcionariosSeleccionados .ms-chip-text, \
                                #funcionariosSeleccionados .chip-item, \
                                #funcionariosSeleccionados .tag-text')
                        ).map(el => el.textContent.trim()).filter(Boolean);
                    }
                }

                const funcionariosHTML = nombresFuncionarios.length
                    ? nombresFuncionarios.map(n => `<p style="margin:0">${escapeHtml(n)}</p>`).join("")
                    : "—";

                // descripción SIEMPRE dentro de <p>, preservando \n
                const descripcionHTML = `<p style="margin:4px 0 0; white-space:pre-wrap;">${descripcion ? escapeHtml(descripcion) : "—"
                    }</p>`;



                // Helper de fecha
                const formatFecha = (s) => {
                    if (!s || !s.includes('-')) return s || '—';
                    const [y, m, d] = s.split('-');
                    return `${d}/${m}/${y}`;
                };

                // 3) Confirmación
                const { isConfirmed } = await Swal.fire({
                    icon: 'question',
                    title: 'Confirmar creación',
                    html: `
                        <div class="confirmacion-egreso" style="text-align:left">
                            <div><strong>Nº Egreso:</strong> ${numero || '—'}</div>
                            <div><strong>Fecha:</strong> ${formatFecha(fechaISO)}</div>
                            <div><strong>Destinatario:</strong> ${destinatario}</div>
                            <div><strong>Funcionarios:</strong>
                                <div class="funcionarios-confirmar" style="margin-top:4px">${funcionariosHTML}</div>
                            </div>
                            <div style="margin-top:6px;"><strong>Archivo:</strong> ${archivo}</div>
                            <div style="margin-top:6px;flex-direction: column;">
                                <strong>Descripción:</strong>
                                ${descripcionHTML}
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Crear egreso',
                    cancelButtonText: 'Revisar',
                    reverseButtons: true,
                    heightAuto: false,
                    scrollbarPadding: false
                });


                if (!isConfirmed) return;

                // 4) Enviar
                form.dataset.sending = "1";
                const data = new FormData(form);

                try {
                    const res = await fetch('/bnup/egresos_au_create/', {
                        method: 'POST',
                        body: data,
                        headers: { 'X-CSRFToken': getCSRFToken() }
                    });
                    const json = await res.json();

                    if (json.success) {
                        // === TU FLUJO EXISTENTE (tal cual) ===
                        cerrarFormModal();

                        const { id, numero_egreso, fecha_egreso, descripcion, funcionarios, destinatario, archivo_url } = json.egreso;

                        const fechaFormateada = formatFecha(fecha_egreso);

                        const tabla = document.getElementById('tablaEgresosAU');
                        const tbody = tabla.querySelector('tbody');
                        const tr = document.createElement('tr');

                        tr.dataset.id = id;
                        tr.dataset.numero = numero_egreso;
                        tr.dataset.fecha = fechaFormateada;
                        tr.dataset.funcionario = funcionarios;
                        tr.dataset.destinatario = destinatario;
                        tr.dataset.descripcion = descripcion || '';

                        const ordenFecha = (fecha_egreso || '').replaceAll('-', ''); // YYYYMMDD

                        tr.innerHTML = `
                <td class="celda-checkbox">
                    <div>
                    <input type="checkbox" class="rowCheckbox" data-id="${id}">
                    </div>
                </td>
                <td class="celda-numEgreso" data-order="${numero_egreso}">
                    <div>${numero_egreso}</div>
                </td>
                <td class="celda-fecha" data-order="${ordenFecha}">
                    <div>${fechaFormateada}</div>
                </td>
                <td>${funcionarios}</td>
                <td>${destinatario}</td>
                <td class="descripcion-cell">
                    <div>
                        <span class="span-descripcion-cell" style="cursor:pointer;">
                            ${descripcion ? descripcion.slice(0, 40) : '—'}
                        </span>
                        <span class="material-symbols-outlined preview-btn">preview</span>
                    </div>
                </td>
                <td class="celda-adjunto">
                    ${archivo_url
                                ? `<div>
                            <div class="icon-container">
                                <a href="${archivo_url}" target="_blank" style="text-decoration:none;">
                                    <button class="buttonLogin buttonPreview">
                                        <span class="material-symbols-outlined bell">find_in_page</span>
                                    </button>
                                </a>
                                <div class="tooltip">Ver adjunto</div>
                            </div>
                        </div>`
                                : '—'}
                </td>
                <td class="celda-respuesta">
                    <div class="icon-container">
                    <button class="buttonLogin buttonPreview btn-add-respuesta" data-id="${id}">
                        <span class="material-symbols-outlined bell">note_add</span>
                    </button>
                    <div class="tooltip">Subir respuesta</div>
                    </div>
                </td>
            `;

                        tbody.insertBefore(tr, tbody.firstChild);
                        initializeTable('tablaEgresosAU', 'paginationEgresosAU', 10, null);
                        setupFiltersEgresosAU('tablaEgresosAU', 'searchEgresosAU');
                        setupRowSelection('tablaEgresosAU');
                        setupEgresosDeleteToggle();

                        Swal.fire({
                            icon: 'success',
                            title: 'Éxito',
                            text: 'Egreso creado',
                            heightAuto: false,
                            scrollbarPadding: false
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: json.error || 'Algo falló',
                            heightAuto: false,
                            scrollbarPadding: false
                        });
                    }
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err?.message || 'No se pudo crear el egreso.',
                        heightAuto: false,
                        scrollbarPadding: false
                    });
                } finally {
                    delete form.dataset.sending;
                }
            };

            return;
        }

        // ─────────────────────────────────────────────
        // clic en "Editar" (debe haber 1 seleccionado)
        // ─────────────────────────────────────────────
        if (event.target.closest('#editSelectedEgresos')) {
            event.preventDefault();

            const table = document.getElementById('tablaEgresosAU');
            if (!table) return;

            const checked = Array.from(table.querySelectorAll('tbody .rowCheckbox:checked'));
            if (checked.length === 0) {
                return Swal.fire('Atención', 'Seleccione un egreso para editar.', 'info');
            }
            if (checked.length > 1) {
                return Swal.fire('Atención', 'Sólo puede editar uno a la vez.', 'info');
            }

            const tr = checked[0].closest('tr');
            const egresoId = tr?.dataset.id;
            if (!egresoId) return;

            const overlay = document.getElementById('egresoEditModalOverlay');
            const content = overlay.querySelector('.modal-content');

            // cargar formulario de edición
            const resp = await fetch(`/bnup/egresos_au_edit/${egresoId}/`);
            if (!resp.ok) {
                return Swal.fire('Error', 'No se pudo cargar el formulario de edición', 'error');
            }
            content.innerHTML = await resp.text();

            // multi-select
            initializeMultiSelect({
                selectSelector: '#multi_funcionarios_edit',
                containerSelector: '#funcionariosSeleccionados_edit',
                hiddenInputSelector: '#funcionariosHidden_edit',
            });

            // Precargar seleccionados: tomamos el hidden CSV y disparamos "change" por cada id
            const hidden = content.querySelector('#funcionariosHidden_edit');
            const sel = content.querySelector('#multi_funcionarios_edit');
            (hidden.value || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .forEach(id => {
                    const opt = sel.querySelector(`option[value="${id}"]`);
                    if (opt) {
                        sel.value = id;
                        sel.dispatchEvent(new Event('change')); // esto crea el chip y deshabilita la opción
                    }
                });

            // estandarizador + file input
            initializeStandardizeInputs(content);
            // inicializar fileinput con el nombre actual como caption y sin botón eliminar
            const $file = content.querySelector('#archivo_adjunto_edit');
            const initialCaption = ($file && $file.dataset.initialCaption) ? $file.dataset.initialCaption : '';
            initializeFileInput('#archivo_adjunto_edit', {
                showUpload: false,
                showRemove: false,
                showCancel: false,
                dropZoneEnabled: false,
                initialCaption: initialCaption
            });
            const fileResp = content.querySelector('#archivo_respuesta_edit');
            if (fileResp) {
                const initialCap = fileResp.dataset.initialCaption || '';
                initializeFileInput('#archivo_respuesta_edit', {
                    showUpload: false,
                    showRemove: false,
                    showCancel: false,
                    dropZoneEnabled: false,
                    initialCaption: initialCap
                });
            }


            // validación del número (excluyendo este registro)
            const inputNumero = content.querySelector('#numero_egreso_edit');
            const numeroError = content.querySelector('#error_numero_edit');
            let numeroValido = null;

            async function validarNumeroEdit(num) {
                if (!num) return null;
                const r = await fetch(`/bnup/egresos_au/validate_numero/?numero=${encodeURIComponent(num)}&exclude=${encodeURIComponent(egresoId)}&scope=any`);
                if (!r.ok) return null;
                const { exists } = await r.json();     // true => existe en cualquier estado (salvo el propio)
                return !exists;                        // válido ↔ no existe en ningún lado
            }

            inputNumero.addEventListener('blur', async () => {
                const ok = await validarNumeroEdit(inputNumero.value.trim());
                if (ok === null) return;
                numeroValido = ok;
                numeroError.style.display = ok ? 'none' : 'block';
            });

            // mostrar modal + animaciones
            function cerrarEditModal() {
                spanX.onclick = null;
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__animated', 'animate__bounceOut');
                content.addEventListener('animationend', () => {
                    overlay.style.display = 'none';
                    content.classList.remove('animate__animated', 'animate__bounceOut');
                }, { once: true });
            }
            overlay.style.display = 'flex';
            content.classList.add('animate__animated', 'animate__bounceIn');
            const spanX = content.querySelector('.close');
            if (spanX) spanX.onclick = cerrarEditModal;

            // submit edición (reemplaza TODO el cuerpo actual)
            const form = content.querySelector('#egresoAUEditForm');
            form.onsubmit = async (e) => {
                e.preventDefault();

                // evita dobles envíos
                if (form.dataset.sending === "1") return;

                // valida número si no hubo blur
                if (numeroValido === null) {
                    numeroValido = await validarNumeroEdit(inputNumero.value.trim());
                }
                if (numeroValido === false) {
                    inputNumero.focus();
                    return Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'El número de egreso ya existe en un registro activo.',
                        heightAuto: false,
                        scrollbarPadding: false
                    });
                }

                // helper
                const getVal = (sel) => (content.querySelector(sel)?.value || '').trim();
                const escapeHtml = (s) => String(s)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const numero = getVal('#numero_egreso_edit') || getVal('#numero_egreso');
                const fechaISO = getVal('#fecha_egreso_edit') || getVal('#fecha_egreso');
                const descripcion = getVal('#descripcion_edit') || getVal('#descripcion');

                // destinatario (lee el texto de la opción)
                const selDest = content.querySelector('#destinatario_edit') || content.querySelector('#destinatario');
                const destinatario = (selDest && selDest.value)
                    ? selDest.options[selDest.selectedIndex].text
                    : '—';

                // funcionarios (hidden + select, con fallbacks)
                const selFunc = content.querySelector('#multi_funcionarios_edit') || content.querySelector('#multi_funcionarios');
                const hiddenIds = content.querySelector('#funcionariosHidden_edit') || content.querySelector('#funcionariosHidden');
                let nombresFuncionarios = [];

                if (hiddenIds && selFunc) {
                    const ids = (hiddenIds.value || '').split(',').map(s => s.trim()).filter(Boolean);
                    nombresFuncionarios = ids
                        .map(id => selFunc.querySelector(`option[value="${id}"]`)?.textContent?.trim())
                        .filter(Boolean);

                    if (nombresFuncionarios.length === 0) {
                        nombresFuncionarios = Array.from(selFunc.selectedOptions || [])
                            .map(o => o.textContent.trim())
                            .filter(Boolean);
                    }

                    if (nombresFuncionarios.length === 0) {
                        nombresFuncionarios = Array.from(
                            content.querySelectorAll('#funcionariosSeleccionados_edit .chip-text, \
                                  #funcionariosSeleccionados_edit .chip__text, \
                                  #funcionariosSeleccionados_edit .ms-chip-text, \
                                  #funcionariosSeleccionados_edit .chip-item, \
                                  #funcionariosSeleccionados_edit .tag-text, \
                                  #funcionariosSeleccionados .chip-text, \
                                  #funcionariosSeleccionados .chip__text, \
                                  #funcionariosSeleccionados .ms-chip-text, \
                                  #funcionariosSeleccionados .chip-item, \
                                  #funcionariosSeleccionados .tag-text')
                        ).map(el => el.textContent.trim()).filter(Boolean);
                    }
                }

                const funcionariosHTML = nombresFuncionarios.length
                    ? nombresFuncionarios.map(n => `<p style="margin:0">${escapeHtml(n)}</p>`).join("")
                    : `<p style="margin:0">—</p>`;

                // archivos (si no hay nuevo, mostrar caption inicial)
                const fileAdj = content.querySelector('#archivo_adjunto_edit');
                const archivoAdjNombre = (fileAdj?.files?.[0]?.name) || (fileAdj?.dataset.initialCaption) || '—';

                const fileResp = content.querySelector('#archivo_respuesta_edit');
                const archivoRespNombre = (fileResp?.files?.[0]?.name) || (fileResp?.dataset.initialCaption) || '—';

                // fecha → DD/MM/YYYY
                const formatFecha = (s) => {
                    if (!s || !s.includes('-')) return s || '—';
                    const [y, m, d] = s.split('-');
                    return `${d}/${m}/${y}`;
                };

                const descripcionHTML = `<p style="margin:4px 0 0; white-space:pre-wrap;">${descripcion ? escapeHtml(descripcion) : '—'
                    }</p>`;

                // confirmación previa
                const { isConfirmed } = await Swal.fire({
                    icon: 'question',
                    title: 'Confirmar cambios',
                    html: `
                    <div class="confirmacion-egreso" style="text-align:left">
                        <div><strong>Nº Egreso:</strong> ${numero || '—'}</div>
                        <div><strong>Fecha:</strong> ${formatFecha(fechaISO)}</div>
                        <div><strong>Destinatario:</strong> ${destinatario}</div>
                        <div><strong>Funcionarios:</strong>
                        <div class="funcionarios-confirmar" style="margin-top:4px">${funcionariosHTML}</div>
                        </div>
                        <div style="margin-top:6px;"><strong>Archivo principal:</strong> ${archivoAdjNombre}</div>
                        <div style="margin-top:4px;"><strong>Archivo respuesta:</strong> ${archivoRespNombre}</div>
                        <div style="margin-top:6px;flex-direction: column;">
                            <strong>Descripción:</strong>
                            ${descripcionHTML}
                        </div>
                    </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Guardar cambios',
                    cancelButtonText: 'Revisar',
                    reverseButtons: true,
                    heightAuto: false,
                    scrollbarPadding: false
                });

                if (!isConfirmed) return;

                // enviar
                form.dataset.sending = "1";
                const data = new FormData(form);

                const res = await fetch(`/bnup/egresos_au_edit/${egresoId}/`, {
                    method: 'POST',
                    body: data,
                    headers: { 'X-CSRFToken': getCSRFToken() }
                });

                let payload = null, raw = "";
                try { raw = await res.text(); payload = raw ? JSON.parse(raw) : null; } catch { }

                if (!res.ok || !payload || payload.success === false) {
                    const msg = (payload && payload.error) ? payload.error : `Error ${res.status} ${res.statusText}`;
                    delete form.dataset.sending;
                    return Swal.fire({ icon: 'error', title: 'Error', text: msg, heightAuto: false, scrollbarPadding: false });
                }

                // === lo que ya tenías para actualizar la fila ===
                const eg = payload.egreso;

                const formatFechaOut = (s) => {
                    if (!s || !s.includes('-')) return s;
                    const [y, m, d] = s.split('-');
                    return `${d}/${m}/${y}`;
                };

                tr.dataset.numero = eg.numero_egreso;
                tr.dataset.fecha = formatFechaOut(eg.fecha_egreso);
                tr.dataset.funcionario = eg.funcionarios;
                tr.dataset.destinatario = eg.destinatario;
                tr.dataset.descripcion = eg.descripcion || '';

                const tdNum = tr.querySelector('td.celda-numEgreso');
                if (tdNum) {
                    tdNum.setAttribute('data-order', eg.numero_egreso);
                    const divNum = tdNum.querySelector('div');
                    if (divNum) divNum.textContent = eg.numero_egreso;
                }

                const tdFecha = tr.querySelector('td.celda-fecha');
                if (tdFecha) {
                    const yyyymmdd = (eg.fecha_egreso || '').replaceAll('-', '');
                    tdFecha.setAttribute('data-order', yyyymmdd);
                    const divFecha = tdFecha.querySelector('div');
                    if (divFecha) divFecha.textContent = formatFechaOut(eg.fecha_egreso);
                }

                tr.querySelector('td:nth-child(4)').textContent = eg.funcionarios || '—';
                tr.querySelector('td:nth-child(5)').textContent = eg.destinatario || '—';

                const descCellSpan = tr.querySelector('.descripcion-cell .span-descripcion-cell');
                if (descCellSpan) descCellSpan.textContent = eg.descripcion ? eg.descripcion.slice(0, 60) : '—';

                const adjCell = tr.querySelector('.celda-adjunto > div');
                if (adjCell) {
                    if (eg.archivo_url) {
                        adjCell.innerHTML = `
                            <div class="icon-container">
                            <a href="${eg.archivo_url}" target="_blank" style="text-decoration:none;">
                                <button class="buttonLogin buttonPreview">
                                <span class="material-symbols-outlined bell">find_in_page</span>
                                </button>
                            </a>
                            <div class="tooltip">Ver adjunto</div>
                            </div>`;
                    } else {
                        adjCell.textContent = '—';
                    }
                }

                const respCell = tr.querySelector('.celda-respuesta > div');
                if (respCell) {
                    if (eg.archivo_respuesta_url) {
                        respCell.innerHTML = `
                        <div class="icon-container">
                        <a href="${eg.archivo_respuesta_url}" target="_blank" style="text-decoration: none;">
                            <button class="buttonLogin buttonPreview btn-view-respuesta">
                            <span class="material-symbols-outlined bell">find_in_page</span>
                            </button>
                        </a>
                        <div class="tooltip">Ver respuesta</div>
                        </div>`;
                                    } else {
                                        respCell.innerHTML = `
                        <div class="icon-container">
                        <button class="buttonLogin buttonPreview btn-add-respuesta" data-id="${eg.id}">
                            <span class="material-symbols-outlined bell">note_add</span>
                        </button>
                        <div class="tooltip">Subir respuesta</div>
                        </div>`;
                    }
                }

                initializeTable('tablaEgresosAU', 'paginationEgresosAU', 10, null);
                setupFiltersEgresosAU('tablaEgresosAU', 'searchEgresosAU');
                setupRowSelection('tablaEgresosAU');
                setupEgresosDeleteToggle();
                cerrarEditModal();

                delete form.dataset.sending;

                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Egreso actualizado.',
                    heightAuto: false,
                    scrollbarPadding: false
                });
            };


            return; // ← terminamos el flujo de editar
        }


        // 3) Pulsar “preview” de descripción (texto + icono)
        // en la sección "preview" de tu egresos_au.js
        const btnPreview = event.target.closest('.descripcion-cell');
        if (btnPreview) {
            event.preventDefault();
            const tr = btnPreview.closest('tr');
            const overlay = document.getElementById('descripcionModalOverlay');
            const modal = document.getElementById('descripcionModal');

            modal.querySelector('#preview_numero').textContent = tr.dataset.numero;
            modal.querySelector('#preview_fecha').textContent = tr.dataset.fecha;
            const spanFuncionario = modal.querySelector('#preview_funcionario');
            const nombres = (tr.dataset.funcionario || '').split(',').map(s => s.trim());
            spanFuncionario.innerHTML = nombres.map(nombre => `<div>${nombre}</div>`).join('');

            modal.querySelector('#preview_destinatario').textContent = tr.dataset.destinatario;
            // aquí usamos el texto completo, no el truncado
            modal.querySelector('#preview_descripcion').textContent = tr.dataset.descripcion || '—';

            // (resto de tu lógica de animación y cierre…)



            // función de cierre
            function cerrarPreview() {
                spanX.onclick = null;
                modal.classList.remove('animate__bounceIn');
                modal.classList.add('animate__animated', 'animate__bounceOut');
                modal.addEventListener('animationend', () => {
                    overlay.style.display = 'none';
                    modal.classList.remove('animate__animated', 'animate__bounceOut');
                }, { once: true });
            }

            // abrir con animación
            overlay.style.display = 'flex';
            modal.classList.add('animate__animated', 'animate__bounceIn');

            // bind cierre
            const spanX = modal.querySelector('.close');
            if (spanX) spanX.onclick = cerrarPreview;

            return;
        }

        // ─────────────────────────────────────────────
        // clic en "Subir respuesta" (icono note_add)
        // ─────────────────────────────────────────────
        const btnAddResp = event.target.closest('.btn-add-respuesta');
        if (btnAddResp) {
            event.preventDefault();
            const egresoId = btnAddResp.dataset.id;
            if (!egresoId) return;

            const overlay = document.getElementById('egresoRespuestaModalOverlay');
            const content = overlay.querySelector('.modal-content');

            // Cargar form
            const r = await fetch(`/bnup/egresos_au_respuesta/${egresoId}/`);
            if (!r.ok) {
                return Swal.fire('Error', 'No se pudo cargar el formulario de respuesta', 'error');
            }
            content.innerHTML = await r.text();

            // Inicializa fileinput
            initializeFileInput('#archivo_respuesta', {
                showUpload: false,
                dropZoneEnabled: false
            });

            // Animaciones + cierre
            function cerrar() {
                spanX.onclick = null;
                content.classList.remove('animate__bounceIn');
                content.classList.add('animate__animated', 'animate__bounceOut');
                content.addEventListener('animationend', () => {
                    overlay.style.display = 'none';
                    content.classList.remove('animate__animated', 'animate__bounceOut');
                }, { once: true });
            }
            overlay.style.display = 'flex';
            content.classList.add('animate__animated', 'animate__bounceIn');
            const spanX = content.querySelector('.close');
            if (spanX) spanX.onclick = cerrar;

            // Submit
            const form = content.querySelector('#egresoAURespuestaForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const data = new FormData(form);
                const res = await fetch(`/bnup/egresos_au_respuesta/${egresoId}/`, {
                    method: 'POST',
                    body: data,
                    headers: { 'X-CSRFToken': getCSRFToken() }
                });
                const json = await res.json();
                if (!json.success) {
                    return Swal.fire({ icon: 'error', title: 'Error', text: json.error || 'No se pudo guardar.', heightAuto: false, scrollbarPadding: false });
                }

                // Actualiza la celda en la fila
                const table = document.getElementById('tablaEgresosAU');
                const tr = table.querySelector(`tbody tr[data-id="${egresoId}"]`);
                const cell = tr?.querySelector('.celda-respuesta > div');
                if (cell) {
                    const url = json.egreso.archivo_respuesta_url;
                    cell.innerHTML = `
                        <div class="icon-container">
                        <a href="${url}" target="_blank" style="text-decoration: none;">
                            <button class="buttonLogin buttonPreview btn-view-respuesta">
                                <span class="material-symbols-outlined bell">find_in_page</span>
                            </button>
                        </a>
                        <div class="tooltip">Ver respuesta</div>
                        </div>`;
                }

                cerrar();
                Swal.fire({ icon: 'success', title: 'Guardado', text: 'Respuesta subida.', heightAuto: false, scrollbarPadding: false });
            };

            return;
        }

        // 4) Volver a BNUP
        const btnBack = event.target.closest('#backToBNUP');
        if (btnBack) {
            event.preventDefault();
            const bnupLink = document.querySelector('a[data-content="BNUP"]');
            if (bnupLink) bnupLink.click();
            return;
        }

        const delBtn = event.target.closest('#deleteSelectedEgresos');
        if (!delBtn) return;

        // Solo actuamos si la tabla de egresos está visible en DOM
        const table = document.getElementById('tablaEgresosAU');
        if (!table) return; // dejar que otros módulos usen el botón en otras vistas

        event.preventDefault();

        const checked = Array.from(table.querySelectorAll('tbody .rowCheckbox:checked'));
        if (checked.length === 0) return;

        const ids = checked.map(cb => cb.closest('tr')?.dataset.id || cb.dataset.id).filter(Boolean);

        const rows = checked.map(cb => cb.closest('tr'));
        // tomamos el número desde data-numero; si por algo no está, cae al texto de la 2ª celda
        const numeros = rows.map(tr =>
            tr?.dataset.numero || tr?.querySelector('td:nth-child(2)')?.textContent.trim()
        ).filter(Boolean);

        let msg;
        if (ids.length === 1) {
            msg = `¿Está seguro que quiere eliminar el egreso Nº ${numeros[0]}?`;
        } else {
            const maxList = 5; // para no hacer el diálogo infinito
            const listado = numeros.slice(0, maxList).join(', ');
            const extra = numeros.length > maxList ? ` y ${numeros.length - maxList} más` : '';
            msg = `¿Está seguro que quiere eliminar ${numeros.length} egresos (${listado}${extra})?`;
        }

        const { isConfirmed } = await Swal.fire({
            title: 'Confirmar eliminación',
            text: msg,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#E73C45',
            reverseButtons: true,
            heightAuto: false,
            scrollbarPadding: false
        });
        if (!isConfirmed) return;

        try {
            const res = await fetch('/bnup/egresos_au/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ ids })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'No se pudo eliminar');

            // Quitar filas del DOM
            ids.forEach(id => {
                const tr = table.querySelector(`tbody tr[data-id="${id}"]`);
                if (tr) tr.remove();
            });

            // Reinicializar paginación/sorting/selección
            initializeTable('tablaEgresosAU', 'paginationEgresosAU', 10, null);
            setupFiltersEgresosAU('tablaEgresosAU', 'searchEgresosAU');

            setupRowSelection('tablaEgresosAU');


            // Reset botones/checkbox cabecera
            const headChk = table.querySelector('thead .select-all');
            if (headChk) headChk.checked = false;
            const btnDelete = document.getElementById('deleteSelectedEgresos');
            if (btnDelete) btnDelete.disabled = true;

            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: ids.length === 1 ? 'Egreso eliminado.' : `${ids.length} egresos eliminados.`,
                heightAuto: false,
                scrollbarPadding: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Ocurrió un problema al eliminar.',
                heightAuto: false,
                scrollbarPadding: false
            });
        }
    });
})();
