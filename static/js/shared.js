// shared.js

/**
 * Resalta o desresalta una fila de la tabla según si el checkbox está marcado.
 * @param {HTMLElement} row - Fila de la tabla.
 * @param {boolean} isChecked - Estado del checkbox.
 */
function toggleRowHighlight(row, isChecked) {
    if (isChecked) {
        row.classList.add('fila-marcada');
        row.classList.add('animate__headShake');
    } else {
        row.classList.remove('fila-marcada');
        row.classList.remove('animate__headShake');

    }
}

/**
 * Habilita o deshabilita botones de acción según las filas seleccionadas.
 * Debes asegurarte de que las variables `rowCheckboxes`, `deleteButton` y `editButton` estén definidas en el ámbito donde se use esta función.
 */
function updateActionButtonsState() {
    // Estas variables deben ser definidas en el ámbito global o pasar como parámetros
    const rowCheckboxes = document.querySelectorAll('.rowCheckbox');
    const deleteButton =
        document.getElementById('deleteSelectedEgresos') ||
        document.getElementById('deleteSelected');
    const editButton =
        document.getElementById('editSelectedEgresos') ||
        document.getElementById('editSelected');

    const selectedCheckboxes = Array.from(rowCheckboxes).filter(cb => cb.checked);
    const anyChecked = selectedCheckboxes.length > 0;

    if (deleteButton) {
        deleteButton.disabled = !anyChecked;
    }

    if (editButton) {
        editButton.disabled = !anyChecked;
    }
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

/**
 * Determina el número de filas por página según el ancho de la pantalla.
 */
function getRowsPerPage() {
    if (window.matchMedia("(width: 1280px) and (height: 720px)").matches) return 8;
    if (window.matchMedia("(width: 1366px) and (height: 607px)").matches) return 7;
    if (window.matchMedia("(width: 1366px) and (height: 768px)").matches) return 9;
    if (window.matchMedia("(width: 1600px) and (height: 900px)").matches) return 10;

    return 9; // por defecto
}


/**
 * Objeto para mantener el estado de cada tabla.
 * Mantener este objeto aquí para ser accesible por todas las funciones de tabla.
 */
const tableStates = {};

// shared.js

// ——————————————————————————————
// 1) NUEVAS FUNCIONES MODULARES:
// ——————————————————————————————
/**
 * Inicializa todos los controles de filtrado para la tabla.
 * @param {string} tableId            - ID de la tabla.
 * @param {string} [searchInputId]    - ID del input de búsqueda global.
 */
function setupFilters(tableId, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const colIdx = {
        ingreso: headers.findIndex(h => h.textContent.trim().startsWith('Fecha Ingreso')),
        solicitud: headers.findIndex(h => h.textContent.trim().startsWith('Fecha Solicitud')),
        solicitante: headers.findIndex(h => h.textContent.trim().startsWith('Solicitante')),
        tipoRec: headers.findIndex(h => h.textContent.trim().startsWith('Tipo Recepción')),
        tipoSol: headers.findIndex(h => h.textContent.trim().startsWith('Tipo Solicitud')),
        funcionario: headers.findIndex(h => h.textContent.trim().startsWith('Funcionario')),
    };

    // Si no tenemos las dos columnas de fecha, no aplicamos filtros aquí:
    if (colIdx.ingreso < 0 || colIdx.solicitud < 0) {
        return;
    }

    const state = tableStates[tableId];
    const tbody = table.tBodies[0];

    // Referencias UI
    const searchInput = searchInputId && document.getElementById(searchInputId);
    const btnFilters = document.getElementById('btnToggleFilters');
    const panel = document.getElementById('filterPanel');
    const filtroIDesde = document.getElementById('filtroIngresoDesde');
    const filtroIHasta = document.getElementById('filtroIngresoHasta');
    const filtroSDesde = document.getElementById('filtroSolicitudDesde');
    const filtroSHasta = document.getElementById('filtroSolicitudHasta');
    const filtroSol = document.getElementById('filtroSolicitante');
    const filtroTR = document.getElementById('filtroTipoRecepcion');
    const filtroTS = document.getElementById('filtroTipoSolicitud');
    const filtroF = document.getElementById('filtroFuncionario');
    const btnReset = document.getElementById('btnResetFilters');

    // 1) Poner por defecto el rango al año en curso
    const now = new Date();
    const year = now.getFullYear();
    if (filtroIDesde) filtroIDesde.value = `${year}-01-01`;
    if (filtroIHasta) filtroIHasta.value = `${year}-12-31`;
    // Función central de filtrado
    function applyFilters() {
        // Limpia mensaje
        tbody.querySelectorAll('.no-results').forEach(r => r.remove());

        state.filteredRows = state.rows.filter(row => {
            const cells = row.cells;
            const parseDate = str => {
                const [d, m, y] = str.split('/');
                return new Date(y, m - 1, d);
            };
            const fIng = parseDate(cells[colIdx.ingreso].innerText);
            const fSol = parseDate(cells[colIdx.solicitud].innerText);

            if (filtroIDesde.value && fIng < new Date(filtroIDesde.value)) return false;
            if (filtroIHasta.value && fIng > new Date(filtroIHasta.value)) return false;
            if (filtroSDesde.value && fSol < new Date(filtroSDesde.value)) return false;
            if (filtroSHasta.value && fSol > new Date(filtroSHasta.value)) return false;
            if (filtroSol.value && cells[colIdx.solicitante].innerText.trim() !== filtroSol.value) return false;
            if (filtroTR.value && cells[colIdx.tipoRec].innerText.trim() !== filtroTR.selectedOptions[0].text) return false;
            if (filtroTS.value && cells[colIdx.tipoSol].innerText.trim() !== filtroTS.selectedOptions[0].text) return false;
            if (filtroF.value && !cells[colIdx.funcionario].innerText.toLowerCase().includes(filtroF.value.toLowerCase())) return false;
            if (state.searchTerm) {
                const term = state.searchTerm;
                let hayMatch = row.innerText.toLowerCase().includes(term);

                // --- antigua búsqueda en data-salidas y data-fulltext ---
                const salidas = (row.getAttribute('data-salidas') || '').toLowerCase();
                hayMatch = hayMatch || salidas.includes(term);

                const preview = row.querySelector('.descripcion-preview');
                if (preview) {
                    const desc = (preview.getAttribute('data-fulltext') || '').toLowerCase();
                    hayMatch = hayMatch || desc.includes(term);
                }

                // --- nueva búsqueda en descripciones de salidas ---
                const salidasDesc = (row.getAttribute('data-salidas-descripciones') || '').toLowerCase();
                hayMatch = hayMatch || salidasDesc.includes(term);

                if (!hayMatch) return false;
            }
            return true;
        });

        // ——— 3) ORDENAR siempre POR Nº INGRESO DESCENDENTE ———
        const headers = Array.from(table.querySelectorAll('thead th'));
        const idxNIngreso = headers.findIndex(h =>
            h.textContent.trim().startsWith('Nº Ingreso')
        );
        if (idxNIngreso > -1) {
            state.filteredRows.sort((a, b) => {
                const va = parseFloat(
                    a.cells[idxNIngreso].getAttribute('data-order') ||
                    a.cells[idxNIngreso].innerText
                ) || 0;
                const vb = parseFloat(
                    b.cells[idxNIngreso].getAttribute('data-order') ||
                    b.cells[idxNIngreso].innerText
                ) || 0;
                return vb - va;  // descendente
            });
            // refrescar indicador de flecha
            headers.forEach(h => h.classList.remove('ascending', 'descending'));
            headers[idxNIngreso].classList.add('descending');
        }

        // 2) RECONSTRUIR el <tbody> a partir de state.filteredRows
        tbody.innerHTML = '';
        state.filteredRows.forEach(row => {
            tbody.appendChild(row);
        });

        state.currentPage = 1;
        displayRows(state, 1);
        setupPagination(state);

        // ——— 5) Mensaje “sin resultados” si no hay filas ———
        if (state.filteredRows.length === 0) {
            const noRow = document.createElement('tr');
            noRow.classList.add('no-results');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = '🚫 No se encontraron resultados. Ajusta los filtros.';
            td.style.textAlign = 'center';
            td.style.fontStyle = 'italic';
            noRow.appendChild(td);
            tbody.appendChild(noRow);
        }

    }

    applyFilters();

    // Conectar búsqueda global
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            state.searchTerm = searchInput.value.trim().toLowerCase();
            applyFilters();
            // Si la búsqueda quedó vacía, restauramos el orden inicial por Nº Ingreso (descendente)
            if (!state.searchTerm) {
                // 1) Reordenar siempre por Nº Ingreso desc:
                const headers = Array.from(table.querySelectorAll('thead th'));
                const idxNIngreso = headers.findIndex(h => h.textContent.trim().startsWith('Nº Ingreso'));
                if (idxNIngreso > -1) {
                    state.filteredRows.sort((rowA, rowB) => {
                        // obtener valor numérico de data-order o innerText
                        const a = parseFloat(rowA.cells[idxNIngreso].getAttribute('data-order') || rowA.cells[idxNIngreso].innerText) || 0;
                        const b = parseFloat(rowB.cells[idxNIngreso].getAttribute('data-order') || rowB.cells[idxNIngreso].innerText) || 0;
                        return b - a; // descendente
                    });
                    // actualizar indicador de flecha
                    headers.forEach(h => h.classList.remove('ascending', 'descending'));
                    headers[idxNIngreso].classList.add('descending');
                }

                // 2) Mostrar y paginar
                state.currentPage = 1;
                displayRows(state, 1);
                setupPagination(state);
            }
        });
    }


    // Conectar cada filtro
    [filtroIDesde, filtroIHasta, filtroSDesde, filtroSHasta,
        filtroSol, filtroTR, filtroTS, filtroF]
        .forEach(el => el?.addEventListener('change', applyFilters));

    btnReset?.addEventListener('click', () => {
        const now = new Date();
        const year = now.getFullYear();

        // 1) Resetear sólo los filtros que NO sean Fecha de Ingreso
        [ /*filtroIDesde, filtroIHasta,*/
            filtroSDesde, filtroSHasta,
            filtroSol, filtroTR, filtroTS, filtroF
        ].forEach(el => {
            if (el) el.value = '';
        });

        // 2) Restaurar explícitamente Fecha de Ingreso al año en curso
        if (filtroIDesde) filtroIDesde.value = `${year}-01-01`;
        if (filtroIHasta) filtroIHasta.value = `${year}-12-31`;

        // 3) Limpiar búsqueda global
        if (searchInput) {
            searchInput.value = '';
            state.searchTerm = '';
        }

        // 4) Aplicar filtros (que internamente ya ordena y repagina)
        applyFilters();

        // 5) Reordenar la columna “Nº Ingreso” descendente
        const headers = Array.from(table.querySelectorAll('thead th'));
        const idx = headers.findIndex(h =>
            h.textContent.trim().startsWith('Nº Ingreso')
        );
        if (idx > -1) {
            headers.forEach(h => h.classList.remove('ascending', 'descending'));
            sortTable(table, idx, 'number', false);
            headers[idx].classList.add('descending');
        }
    });


    // ——— Nuevo patrón para abrir/cerrar el panel ———
    btnFilters?.addEventListener('click', e => {
        e.stopPropagation();               // evita que este click cierre el panel
        panel.style.display = 'block';    // mostramos el panel

        // Listener temporal para cerrar al clicar fuera
        const closePanel = ev => {
            if (!panel.contains(ev.target) && !btnFilters.contains(ev.target)) {
                panel.style.display = 'none';
                document.removeEventListener('click', closePanel);
            }
        };
        // Registrarlo en la próxima vuelta de evento
        setTimeout(() => document.addEventListener('click', closePanel), 0);
    });

}

/**
 * Filtros y búsqueda para la tabla de Egresos AU.
 * Campos: Nº Egreso, Fecha (desde/hasta), Funcionario (contiene), Destinatario (select),
 * Descripción (contiene), Adjunto (sí/no), Respuesta (sí/no) + búsqueda global.
 */
function setupFiltersEgresosAU(tableId, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const colIdx = {
        numero: headers.findIndex(h => h.textContent.trim().startsWith('Nº Egreso')),
        fecha: headers.findIndex(h => h.textContent.trim().startsWith('Fecha')),
        funcionario: headers.findIndex(h => h.textContent.trim().startsWith('Funcionario')),
        destinatario: headers.findIndex(h => h.textContent.trim().startsWith('Destinatario')),
        descripcion: headers.findIndex(h => h.textContent.trim().startsWith('Descripción')),
        adjunto: headers.findIndex(h => h.textContent.trim().startsWith('Adjunto')),
        respuesta: headers.findIndex(h => h.textContent.trim().startsWith('Respuesta')),
    };
    if (colIdx.numero < 0 || colIdx.fecha < 0) return; // sin columnas base

    const state = tableStates[tableId];
    const tbody = table.tBodies[0];

    // UI
    const searchInput = searchInputId && document.getElementById(searchInputId);
    const btnFilters = document.getElementById('btnToggleFiltersEgresosAU');
    const panel = document.getElementById('filterPanelEgresosAU');

    const fNum = document.getElementById('filtroNumeroEgreso');
    const fFecD = document.getElementById('filtroFechaDesdeEgreso');
    const fFecH = document.getElementById('filtroFechaHastaEgreso');
    const fFunc = document.getElementById('filtroFuncionarioEgreso');
    const fDest = document.getElementById('filtroDestinatarioEgreso');
    const fDesc = document.getElementById('filtroDescripcionEgreso');
    const fAdj = document.getElementById('filtroAdjuntoEgreso');
    const fResp = document.getElementById('filtroRespuestaEgreso');
    const btnReset = document.getElementById('btnResetFiltersEgresosAU');

    // Helper: normaliza para búsquedas "accent-insensitive"
    const norm = (s) => (s || '')
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim();

    // Carga opciones de funcionarios desde la tabla (soporta varios por fila "A, B, C")
    (function fillFuncionarios() {
        if (!fFunc) return;
        // limpiar opciones (dejar solo "Todos")
        Array.from(fFunc.options).slice(1).forEach(o => o.remove());

        const set = new Set();
        state.rows.forEach(row => {
            const txt = row.cells[colIdx.funcionario]?.innerText || '';
            txt.split(',').forEach(n => {
                const name = n.trim();
                if (name && name !== '—') set.add(name);
            });
        });
        [...set].sort((a, b) => a.localeCompare(b)).forEach(name => {
            const op = document.createElement('option');
            op.value = name;
            op.textContent = name;
            fFunc.appendChild(op);
        });
    })();

    // Rango por defecto: año en curso (opcional)
    (function defaultYearRange() {
        if (!fFecD || !fFecH) return;
        const now = new Date();
        const y = now.getFullYear();
        if (!fFecD.value) fFecD.value = `${y}-01-01`;
        if (!fFecH.value) fFecH.value = `${y}-12-31`;
    })();

    function parseFechaDDMMYYYY(txt) {
        const [d, m, y] = (txt || '').split('/');
        if (!y || !m || !d) return null;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }

    function hasLink(cellIndex, row) {
        const cell = row.cells[cellIndex];
        return !!cell?.querySelector('a');
    }

    function matchNumero(pattern, cellTxt) {
        const t = (cellTxt || '').trim();
        if (!pattern) return true;
        // Soporta comodín * al final (ej: 12* → empieza por 12)
        if (pattern.endsWith('*')) {
            const base = pattern.slice(0, -1);
            return t.startsWith(base);
        }
        // si no, "contiene"
        return t.includes(pattern);
    }

    // Carga opciones de destinatario desde la tabla
    (function fillDestinatarios() {
        if (!fDest) return;
        if (colIdx.destinatario < 0) return; // por si cambia el header

        // limpiar opciones (dejar solo "Todos")
        Array.from(fDest.options).slice(1).forEach(o => o.remove());

        const set = new Set();
        state.rows.forEach(row => {
            const val = row.cells[colIdx.destinatario]?.innerText?.trim();
            if (val && val !== '—') set.add(val);
        });
        [...set].sort((a, b) => a.localeCompare(b)).forEach(txt => {
            const op = document.createElement('option');
            op.value = txt;
            op.textContent = txt;
            fDest.appendChild(op);
        });
    })();




    function applyFilters() {
        tbody.querySelectorAll('.no-results').forEach(r => r.remove());

        state.filteredRows = state.rows.filter(row => {
            const c = row.cells;

            // Nº egreso
            if (fNum && fNum.value) {
                if (!matchNumero(fNum.value.trim(), c[colIdx.numero].innerText)) return false;
            }

            // Fecha rango (dd/mm/yyyy en celda)
            const f = parseFechaDDMMYYYY(c[colIdx.fecha].innerText);
            if (fFecD?.value && f && f < new Date(fFecD.value)) return false;
            if (fFecH?.value && f && f > new Date(fFecH.value)) return false;

            // Funcionario (select)
            if (fFunc && fFunc.value) {
                const selected = norm(fFunc.value);
                const names = (c[colIdx.funcionario].innerText || '')
                    .split(',').map(s => norm(s));
                if (!names.includes(selected)) return false;
            }

            // ⬇️ Destinatario (select; match exacto normalizado)
            if (fDest && fDest.value) {
                const selected = norm(fDest.value);
                const cellVal = norm(c[colIdx.destinatario].innerText);
                if (cellVal !== selected) return false;
            }

            // Descripción (contiene)
            if (fDesc && fDesc.value) {
                const fromData = row.getAttribute('data-descripcion') || '';
                const texto = (fromData || c[colIdx.descripcion].innerText || '');
                if (!norm(texto).includes(norm(fDesc.value))) return false;
            }

            // Adjunto
            if (fAdj && fAdj.value) {
                const tiene = hasLink(colIdx.adjunto, row);
                if (fAdj.value === 'si' && !tiene) return false;
                if (fAdj.value === 'no' && tiene) return false;
            }

            // Respuesta
            if (fResp && fResp.value) {
                const tiene = hasLink(colIdx.respuesta, row);
                if (fResp.value === 'si' && !tiene) return false;
                if (fResp.value === 'no' && tiene) return false;
            }

            // Búsqueda global
            if (state.searchTerm) {
                const fullRow = [
                    c[colIdx.numero].innerText,
                    c[colIdx.fecha].innerText,
                    c[colIdx.funcionario].innerText,
                    c[colIdx.destinatario].innerText,
                    (row.getAttribute('data-descripcion') || c[colIdx.descripcion].innerText || '')
                ].join(' ');
                if (!norm(fullRow).includes(state.searchTerm)) return false;
            }

            return true;
        });

        // Orden por Nº Egreso (desc) por defecto
        const idx = colIdx.numero;
        state.filteredRows.sort((a, b) => {
            const rawA = a.cells[idx].getAttribute('data-order') || a.cells[idx].innerText;
            const rawB = b.cells[idx].getAttribute('data-order') || b.cells[idx].innerText;
            const va = parseFloat((rawA || '').replace(/[^\d.-]/g, '')) || 0;
            const vb = parseFloat((rawB || '').replace(/[^\d.-]/g, '')) || 0;
            return vb - va;
        });
        headers.forEach(h => h.classList.remove('ascending', 'descending'));
        if (idx > -1) headers[idx].classList.add('descending');

        // Reconstruir tbody
        tbody.innerHTML = '';
        state.filteredRows.forEach(r => tbody.appendChild(r));

        state.currentPage = 1;
        displayRows(state, 1);
        setupPagination(state);

        if (state.filteredRows.length === 0) {
            const tr = document.createElement('tr');
            tr.classList.add('no-results');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.textContent = '🚫 No se encontraron resultados. Ajusta los filtros.';
            td.style.textAlign = 'center';
            td.style.fontStyle = 'italic';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
    }

    // Primera pasada
    applyFilters();

    // Buscar
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            state.searchTerm = norm(searchInput.value);
            applyFilters();
        });
    }

    // Eventos de filtros
    [fNum, fFecD, fFecH, fFunc, fDest, fDesc, fAdj, fResp]
        .forEach(el => el && el.addEventListener('change', applyFilters));

    // Reset
    btnReset?.addEventListener('click', () => {
        [fNum, fFunc, fDest, fDesc, fAdj, fResp].forEach(el => { if (el) el.value = ''; });

        if (fFecD && fFecH) {
            const y = new Date().getFullYear();
            fFecD.value = `${y}-01-01`;
            fFecH.value = `${y}-12-31`;
        }
        if (searchInput) {
            searchInput.value = '';
            state.searchTerm = '';
        }
        applyFilters();
    });

}


/**
 * Inicializa la lógica de ordenamiento por columna en la tabla.
 * @param {string} tableId - ID de la tabla.
 */
function setupSorting(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const allTh = Array.from(table.querySelectorAll('thead th'));
    const clickableTh = table.querySelectorAll('thead th:not(.non-clickable)');
    const state = tableStates[tableId];

    clickableTh.forEach(header => {
        let ascending = true;
        const realIdx = allTh.indexOf(header);
        const type = header.getAttribute('data-type');

        header.addEventListener('click', () => {
            clickableTh.forEach(h => h.classList.remove('ascending', 'descending'));
            sortTable(table, realIdx, type, ascending);
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending;
        });
    });
}


// ——————————————————————————————
// 2) initializeTable REFACTORIZADA
// ——————————————————————————————
function initializeTable(tableId, paginationId, rowsPerPage, searchInputId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Estado inicial
    tableStates[tableId] = {
        rows: Array.from(table.querySelectorAll('tbody tr')),
        filteredRows: Array.from(table.querySelectorAll('tbody tr')),
        currentPage: 1,
        rowsPerPage,
        paginationId,
        searchTerm: '',
    };

    table.setAttribute('data-pagination-id', paginationId);
    if (searchInputId) table.setAttribute('data-search-input-id', searchInputId);

    // 1) Paginación
    paginateTable(tableId, paginationId, rowsPerPage);

    // 2) Sorting
    setupSorting(tableId);

    // 3) Filtros (incluye búsqueda global)
    if (searchInputId) {
        setupFilters(tableId, searchInputId);
    }

    // 4) Ordenamiento inicial por “Nº Ingreso” desc (opcional)
    const headers = Array.from(table.querySelectorAll('thead th'));
    const idxNIngreso = headers.findIndex(h => h.textContent.trim().startsWith('Nº Ingreso'));
    if (idxNIngreso > -1) {
        sortTable(table, idxNIngreso, 'number', false);
        headers[idxNIngreso].classList.add('descending');
    }
}



/**
 * Adjunta controladores de eventos de clic a los encabezados de la tabla para la funcionalidad de ordenamiento.
 * @param {string} tableId - El ID del elemento de la tabla.
 */
function attachSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // 1) Todas las th en orden:
    const allTh = Array.from(table.querySelectorAll('thead th'));

    // 2) Solo las clicables
    const clickableTh = table.querySelectorAll('thead th:not(.non-clickable)');

    clickableTh.forEach(header => {
        let ascending = true;

        // Calculamos su índice real:
        const realIdx = allTh.indexOf(header);

        header.addEventListener('click', () => {
            const type = header.getAttribute('data-type');

            // Limpiar indicadores
            clickableTh.forEach(h => h.classList.remove('ascending', 'descending'));

            // Ordenar por la columna correcta
            sortTable(table, realIdx, type, ascending);

            // Marcar flecha
            header.classList.add(ascending ? 'ascending' : 'descending');
            ascending = !ascending;
        });
    });
}


/**
 * Ordena la tabla basada en una columna específica.
 * @param {HTMLTableElement} table - El elemento de la tabla a ordenar.
 * @param {number} column - El índice de la columna por la cual ordenar.
 * @param {string} type - El tipo de dato de la columna ('number', 'date' o 'string').
 * @param {boolean} ascending - Orden de clasificación; true para ascendente, false para descendente.
 */
function sortTable(table, column, type, ascending) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    const tbody = table.tBodies[0];

    // 1) Ordenamos el array filtrado en lugar de state.rows
    state.filteredRows.sort((rowA, rowB) => {
        const cellA = rowA.cells[column].getAttribute('data-order') || rowA.cells[column].innerText.trim();
        const cellB = rowB.cells[column].getAttribute('data-order') || rowB.cells[column].innerText.trim();
        let a, b;

        switch (type) {
            case 'number':
                a = parseFloat(cellA) || 0;
                b = parseFloat(cellB) || 0;
                break;
            case 'date':
                // 'dd/mm/yyyy' → 'yyyymmdd'
                a = cellA.split('/').reverse().join('');
                b = cellB.split('/').reverse().join('');
                break;
            default:
                a = cellA.toLowerCase();
                b = cellB.toLowerCase();
        }

        if (a < b) return ascending ? -1 : 1;
        if (a > b) return ascending ? 1 : -1;
        return 0;
    });

    // 2) Reconstruimos el tbody solo con las filas filtradas y ya ordenadas
    tbody.innerHTML = '';
    state.filteredRows.forEach(row => tbody.appendChild(row));

    // 3) Después de ordenar, reiniciamos a la página 1
    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, 1);
}


/**
 * Actualiza la paginación y muestra la primera página después del ordenamiento.
 * @param {HTMLTableElement} table - El elemento de la tabla.
 */
function updatePaginationAfterSort(table) {
    const tableId = table.id;
    const state = tableStates[tableId];
    if (!state) return;

    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

/**
 * Configura la paginación para la tabla.
 * @param {string} tableId - El ID del elemento de la tabla.
 * @param {string} paginationId - El ID del contenedor de paginación.
 * @param {number} rowsPerPage - Número de filas a mostrar por página.
 */
function paginateTable(tableId, paginationId, rowsPerPage) {
    const table = document.getElementById(tableId);
    const pagination = document.getElementById(paginationId);
    if (!table || !pagination) return;

    // Inicializar el estado de la tabla si no existe
    if (!tableStates[tableId]) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        tableStates[tableId] = {
            tableId: tableId,
            rows: rows,
            filteredRows: [...rows],
            currentPage: 1,
            rowsPerPage: rowsPerPage,
            paginationId: paginationId,
            searchInputId: table.getAttribute('data-search-input-id'),
            searchTerm: '',
        };
    }

    const state = tableStates[tableId];



    // Mostrar filas iniciales y configurar controles de paginación
    displayRows(state, state.currentPage);
    setupPagination(state);
}

/**
 * Muestra las filas correspondientes a la página actual.
 * @param {Object} state - El objeto de estado de la tabla.
 * @param {number} page - El número de la página actual.
 */
function displayRows(state, page) {
    const start = (page - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;

    // Ocultar todas las filas
    state.rows.forEach(row => {
        row.style.display = 'none';
    });

    // Mostrar las filas de la página actual
    state.filteredRows.slice(start, end).forEach(row => {
        row.style.display = '';
    });
}

/**
 * Configura los controles de paginación.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function setupPagination(state) {
    const pageCount = Math.ceil(state.filteredRows.length / state.rowsPerPage);
    const pagination = document.getElementById(state.paginationId);
    pagination.innerHTML = ''; // Limpiar paginación existente

    const maxVisiblePages = 3; // Máximo de botones de páginas visibles
    let startPage = Math.max(state.currentPage - 1, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, pageCount);

    // Ajustar páginas visibles si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    // Botón para ir a la página anterior
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<span class="material-symbols-outlined">arrow_back_2</span>';
    prevButton.className = 'page-btn prev';
    prevButton.disabled = state.currentPage === 1;
    prevButton.addEventListener('click', function () {
        if (state.currentPage > 1) {
            state.currentPage--;
            displayRows(state, state.currentPage);
            setupPagination(state);
        }
    });
    pagination.appendChild(prevButton);

    // Botones para los números de página visibles
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'page-btn';
        if (i === state.currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', function () {
            state.currentPage = i;
            displayRows(state, state.currentPage);
            setupPagination(state);
        });
        pagination.appendChild(pageButton);
    }

    // Botón para ir a la página siguiente
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    nextButton.className = 'page-btn next';
    nextButton.disabled = state.currentPage === pageCount;
    nextButton.addEventListener('click', function () {
        if (state.currentPage < pageCount) {
            state.currentPage++;
            displayRows(state, state.currentPage);
            setupPagination(state);
        }
    });
    pagination.appendChild(nextButton);
}

/**
 * Inicializa la funcionalidad de búsqueda para la tabla.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function searchTable(state) {
    const input = document.getElementById(state.searchInputId);
    if (!input) return;

    input.addEventListener('input', function () {
        const filter = input.value.trim().toLowerCase();
        state.searchTerm = filter;

        // Eliminar resaltados anteriores
        state.rows.forEach(row => {
            row.classList.remove('highlight-row');
        });

        if (filter === '') {
            state.filteredRows = [...state.rows];
            updatePaginationAfterSearch(state);
            return;
        }

        // Filtrar filas basadas en el término de búsqueda
        state.filteredRows = state.rows.filter(row => {
            const cells = Array.from(row.getElementsByTagName('td'));
            let rowText = cells.map(cell => {
                const previewElem = cell.querySelector('.descripcion-preview');
                return previewElem
                    ? (previewElem.getAttribute('data-fulltext') || previewElem.innerText)
                    : cell.innerText;
            }).join(' ').toLowerCase();
            // después, también concatenamos las descripciones:
            const salidasDesc = (row.getAttribute('data-salidas-descripciones') || '').toLowerCase();
            rowText += " " + salidasDesc;
            // Agregar el correo (data-email) y las salidas (data-salidas)
            const email = row.getAttribute('data-email') || '';
            const salidas = row.getAttribute('data-salidas') || '';
            rowText += " " + email.toLowerCase() + " " + salidas.toLowerCase();

            return rowText.includes(filter);
        });

        updatePaginationAfterSearch(state);
    });
}


/**
 * Actualiza la paginación y muestra la primera página después de una búsqueda.
 * @param {Object} state - El objeto de estado de la tabla.
 */
function updatePaginationAfterSearch(state) {
    state.currentPage = 1;
    setupPagination(state);
    displayRows(state, state.currentPage);
}

/**
 * Re-inicializa la tabla cuando se cambia el tamaño de la ventana.
 */
function handleResize() {
    const rowsPerPage = getRowsPerPage();
    // Actualizar tablas existentes
    for (const tableId in tableStates) {
        const state = tableStates[tableId];
        state.rowsPerPage = rowsPerPage;
        state.currentPage = 1;
        setupPagination(state);
        displayRows(state, state.currentPage);
    }
}

// Añadir un listener con debounce al evento resize para mejorar el rendimiento
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 500);
});


// PLUGIN BOOTSTRAP FILE INPUT PARA ARCHIVOS ADJUNTOS
/**
 * Inicializa un input de archivo con el plugin Bootstrap File Input.
 * @param {HTMLElement|string} inputSelector - El input DOM o su selector.
 * @param {Object} [options={}] - Opciones adicionales para personalización.
 */
// shared.js (nuevo)
function initializeFileInput(inputSelector, options = {}) {
    const $input = typeof inputSelector === 'string' ? $(inputSelector) : $(inputSelector);
    if (!$input.length) return;

    // Si ya estaba inicializado (por tener class="file" o reusar el nodo), lo destruimos
    if ($input.data('fileinput')) {
        $input.fileinput('destroy');
    }

    const defaultOptions = {
        theme: 'fas',
        previewFileType: 'any',
        showPreview: false,        // ← DESACTIVA PREVIEW
        dropZoneEnabled: false,    // ← SIN DROPZONE
        showUpload: false,
        showRemove: false,
        showCancel: false,
        browseClass: 'btn-info',
        removeClass: 'btn-danger',
        browseLabel: '<span class="material-symbols-outlined" style="vertical-align: middle;">upload_file</span> Adjuntar',
        removeLabel: '<span class="material-symbols-outlined" style="vertical-align: middle;">close</span> Quitar',
    };

    const config = { ...defaultOptions, ...options };
    $input.fileinput(config);

    $input.on('fileloaded', () => {
        $input.closest('.file-input').find('.kv-fileinput-caption').show();
    });
}



/* ------------------------------------------------------------------ */
/*   MÓDULO MULTI-SELECT (funcionarios, etiquetas, etc.)              */
/* ------------------------------------------------------------------ */
/**
 * Permite seleccionar varios elementos de un <select> y mostrarlos
 * como chips “cerrables”.  Devuelve un objeto con utilidades.
 *
 * Eventos soportados en el <select>:
 *  - ms:reset  → limpia estado interno + UI (equivalente a api.reset())
 *  - ms:set    → siembra valores: new CustomEvent('ms:set', { detail:{ ids:[...] } })
 *
 * @param {Object} cfg
 *  ├─ selectSelector      (string|HTMLElement)  <select>
 *  ├─ containerSelector   (string|HTMLElement)  donde se dibujan chips
 *  ├─ hiddenInputSelector (string|HTMLElement)  input hidden con IDs
 *  ├─ animationIn         (string)  clase AnimateCSS de entrada
 *  └─ animationOut        (string)  clase AnimateCSS de salida
 */
function initializeMultiSelect(cfg) {
    // ─── normalizamos referencias ───────────────────────────────────
    const $sel = typeof cfg.selectSelector === 'string' ? document.querySelector(cfg.selectSelector) : cfg.selectSelector;
    const $cont = typeof cfg.containerSelector === 'string' ? document.querySelector(cfg.containerSelector) : cfg.containerSelector;
    const $hid = typeof cfg.hiddenInputSelector === 'string' ? document.querySelector(cfg.hiddenInputSelector) : cfg.hiddenInputSelector;
    if (!$sel || !$cont || !$hid) return console.warn('initializeMultiSelect: selector no encontrado');

    const ANIM_IN = cfg.animationIn || 'animate__bounceIn';
    const ANIM_OUT = cfg.animationOut || 'animate__bounceOut';

    /** id → nombre */
    const seleccionados = new Map();

    // ─── helpers ────────────────────────────────────────────────────
    function syncHidden() {
        $hid.value = Array.from(seleccionados.keys()).join(',');
    }

    function addChip(id, nombre) {
        // Evita chips duplicados en DOM
        if ($cont.querySelector(`.selected-item[data-id="${id}"]`)) return;

        const chip = document.createElement('span');
        chip.className = `selected-item animate__animated ${ANIM_IN}`;
        chip.dataset.id = id;
        chip.innerHTML = `${nombre}
      <span data-id="${id}" class="material-symbols-outlined">close_small</span>`;
        $cont.appendChild(chip);
    }

    function disableOption(id, disabled) {
        const opt = $sel.querySelector(`option[value="${CSS.escape(id)}"]`);
        if (opt) opt.disabled = !!disabled;
    }

    function select2SyncClearIfAny() {
        // Si usas select2, mantén sincronía; es opcional y seguro
        if (typeof window.$ === 'function' && window.$($sel).length && window.$($sel).data('select2')) {
            window.$($sel).val(null).trigger('change.select2');
        }
    }

    function renderNewOnes() {
        // Renderiza sólo los chips faltantes
        const ya = new Set(Array.from($cont.children).map(el => el.dataset.id));
        seleccionados.forEach((nombre, id) => {
            if (!ya.has(id)) addChip(id, nombre);
        });
        syncHidden();
    }

    function addSelection(id, nombre) {
        if (!id) return;
        if (!seleccionados.has(id)) {
            seleccionados.set(id, (nombre || '').trim());
            disableOption(id, true);
            addChip(id, seleccionados.get(id));
            syncHidden();
        }
        // volver al placeholder
        $sel.selectedIndex = 0;
        select2SyncClearIfAny();
    }

    function clearAll() {
        seleccionados.clear();
        $cont.innerHTML = '';
        $hid.value = '';
        $sel.querySelectorAll('option').forEach(o => { o.disabled = false; o.selected = false; });
        $sel.selectedIndex = 0;
        select2SyncClearIfAny();
    }

    // ─── evento change en <select> ──────────────────────────────────
    $sel.addEventListener('change', () => {
        const opt = $sel.selectedOptions[0];
        if (!opt || !opt.value) return;
        addSelection(opt.value, opt.textContent || opt.innerText || opt.value);
    });

    // ─── click en chips (eliminar) ──────────────────────────────────
    $cont.addEventListener('click', e => {
        const id = e.target?.dataset?.id;
        if (!id) return;

        const chip = e.target.closest('.selected-item');
        if (!chip) return;

        chip.classList.remove(ANIM_IN);
        chip.classList.add('animate__animated', ANIM_OUT);

        chip.addEventListener('animationend', () => {
            chip.remove();
            seleccionados.delete(id);
            syncHidden();
            disableOption(id, false);
        }, { once: true });
    });

    // ─── eventos custom: reset / set ────────────────────────────────
    $sel.addEventListener('ms:reset', clearAll);

    $sel.addEventListener('ms:set', (ev) => {
        const ids = (ev.detail && Array.isArray(ev.detail.ids)) ? ev.detail.ids : [];
        // Limpia antes de sembrar
        clearAll();
        ids.forEach(id => {
            const opt = $sel.querySelector(`option[value="${CSS.escape(String(id))}"]`);
            const nombre = opt ? (opt.textContent || opt.innerText || String(id)) : String(id);
            addSelection(String(id), nombre);
        });
        renderNewOnes();
    });

    // ─── API pública ────────────────────────────────────────────────
    return {
        /** Devuelve array de IDs actualmente seleccionados */
        getSelectedIds: () => Array.from(seleccionados.keys()),
        /** Limpia selección y restablece UI */
        reset: clearAll,
        /** Siembra valores programáticamente */
        setSelected(ids = []) {
            const evt = new CustomEvent('ms:set', { detail: { ids } });
            $sel.dispatchEvent(evt);
        }
    };
}


/* ------------------------------------------------------------------ */
/*   STANDARDIZE INPUT                                                */
/* ------------------------------------------------------------------ */
function standardizeInput(input) {
    if (!input) return;

    let value = input.value;

    // 1) quitar acentos
    value = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2) a MAYÚSCULAS
    value = value.toUpperCase();

    // 3) trim + colapsar espacios
    value = value.trim().replace(/\s+/g, " ");

    input.value = value;
}

/**
 * Recorre todos los elementos con la clase `.standardize-input`
 * y aplica `standardizeInput` al perder el foco.
 */
function initializeStandardizeInputs(root = document) {
    root.querySelectorAll(".standardize-input").forEach(input => {
        input.addEventListener("blur", () => standardizeInput(input));
        // → si quieres estandarizar “en vivo”, des-comenta:
        // input.addEventListener("input", () => standardizeInput(input));
    });
}

/* ------------------------------------------------------------------ */
/*   MÓDULO  SELECCIÓN  DE  FILAS  CON  CHECKBOX                      */
/* ------------------------------------------------------------------ */
function setupRowSelection(tableId, { highlightClass = 'fila-marcada' } = {}) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // 🔒 evita doble binding
    if (table.dataset.rowSelBound === '1') return;
    table.dataset.rowSelBound = '1';

    const headChk = table.querySelector('thead .select-all');
    const rowChecks = () => table.querySelectorAll('tbody .rowCheckbox');

    function refreshState() {
        const all = rowChecks();
        const on = [...all].filter(cb => cb.checked);
        if (headChk) headChk.checked = on.length === all.length;
        updateActionButtonsState();
    }

    headChk?.addEventListener('change', () => {
        rowChecks().forEach(cb => {
            cb.checked = headChk.checked;
            toggleRowHighlight(cb.closest('tr'), cb.checked);
        });
        refreshState();
    });

    table.addEventListener('change', e => {
        if (!e.target.classList.contains('rowCheckbox')) return;
        toggleRowHighlight(e.target.closest('tr'), e.target.checked);
        refreshState();
    });
}


// Toggle global para el panel de filtros de Egresos AU (delegado y a prueba de re-render)
(function () {
    if (window.__egresosAUToggleBound) return; // evita duplicarlo si re-importas
    window.__egresosAUToggleBound = true;

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btnToggleFiltersEgresosAU');
        if (!btn) return;

        const panel = document.getElementById('filterPanelEgresosAU');
        if (!panel) return; // por si no está en esta vista

        e.preventDefault();
        e.stopPropagation();

        const isOpen = panel.style.display === 'block';

        const closePanel = () => {
            panel.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', outsideHandler);
            document.removeEventListener('keydown', escHandler);
        };
        const outsideHandler = (ev) => {
            if (!panel.contains(ev.target) && !btn.contains(ev.target)) {
                closePanel();
            }
        };
        const escHandler = (ev) => {
            if (ev.key === 'Escape') closePanel();
        };

        if (isOpen) {
            closePanel();
        } else {
            panel.style.display = 'block';
            btn.setAttribute('aria-expanded', 'true');
            // registra los listeners para cerrar
            setTimeout(() => {
                document.addEventListener('click', outsideHandler);
                document.addEventListener('keydown', escHandler);
            }, 0);
        }
    });
})();


/* ------------------------------------------------------------------ */
/*  TIP PARA DESCRIPCIÓN (SweetAlert, una sola vez por instancia)     */
/*  + límite de caracteres (configurable)                             */
/*  + botón/ícono "info" para ver el tip bajo demanda                 */
/* ------------------------------------------------------------------ */
(function () {
    const MAX_DESC_CHARS = 200; // <-- si quieres 150, cámbialo aquí

    function buildTipHTML(maxChars = MAX_DESC_CHARS) {
        return `
      <div style="text-align:left">
        <p><strong>Tips para la descripción</strong></p>
        <ul style="margin-left:1em">
          <li>Máximo <b>${maxChars}</b> caracteres.</li>
          <li>Incluye <b>palabras clave</b> para búsquedas (ej.: <i>calle</i>, <i>poblacion</i>, <i>cerro</i>, <i>U.V</i>).</li>
        </ul>
      </div>`;
    }

    // Muestra el SweetAlert y, opcionalmente, devuelve el foco a targetEl
    function showDescriptionTip(targetEl, html) {
        return Swal.fire({
            title: 'Sugerencias para la descripción',
            html: html,
            icon: 'info',
            confirmButtonText: 'Entendido',
            heightAuto: false,
            scrollbarPadding: false,
            returnFocus: false,    // <— importante: SweetAlert no devuelve el foco por su cuenta
            didClose: () => {
                // Espera un frame para asegurar que aria-hidden ya se removió
                if (targetEl && typeof targetEl.focus === 'function') {
                    requestAnimationFrame(() => targetEl.focus());
                }
            }
        });
    }


    function setupDescriptionTips(root = document, opts = {}) {
        const selectors = opts.selectors || [
            '#descripcion',
            '#descripcion_salida',
            '#edit_descripcion',
            '#edit_descripcion_salida'
        ];
        const tipHTML = opts.html || buildTipHTML(MAX_DESC_CHARS);

        selectors.forEach(sel => {
            const el = root.querySelector(sel);
            if (!el) return;

            // Límite de caracteres (HTML + respaldo JS)
            el.setAttribute('maxlength', String(MAX_DESC_CHARS));
            el.addEventListener('input', () => {
                if (el.value.length > MAX_DESC_CHARS) {
                    el.value = el.value.slice(0, MAX_DESC_CHARS);
                }
            }, { passive: true });

            // Handler de foco (solo una vez por apertura)
            const handler = () => {
                if (el.dataset.tipShown === '1') return; // ya mostrado en esta instancia
                el.dataset.tipShown = '1';
                showDescriptionTip(el, tipHTML);
            };

            el._descTipHandler = handler;
            el.addEventListener('focus', handler, { once: true });
        });
    }

    /**
     * Enlaza el click en el ícono/botón "info" para mostrar el tip bajo demanda,
     * sin tocar el flag tipShown (no interfiere con el comportamiento de foco).
     *
     * Estructura esperada:
     * <div class="label-descripcion">
     *   <label for="ID_DEL_TEXTAREA">...</label>
     *   <div class="icon-label-descripcion"><span class="material-symbols-outlined bell">info</span></div>
     * </div>
     */
    function bindDescriptionTipButtons(root = document, opts = {}) {
        const tipHTML = opts.html || buildTipHTML(MAX_DESC_CHARS);
        const containers = root.querySelectorAll('.label-descripcion');

        containers.forEach(container => {
            const btn = container.querySelector('.icon-label-descripcion, .icon-label-descripcion .bell');
            const lbl = container.querySelector('label[for]');
            if (!btn || !lbl) return;

            // No marcamos tipShown aquí: el botón es "siempre disponible".
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const targetEl = root.getElementById ? root.getElementById(lbl.getAttribute('for')) : document.getElementById(lbl.getAttribute('for'));
                showDescriptionTip(targetEl, tipHTML);
            }, { passive: false });
        });
    }

    /**
     * Reinicia el tip “por instancia” (al abrir un modal/form).
     * Limpia el flag y re-arma el listener de foco. El botón no necesita reset.
     */
    function resetDescriptionTips(root = document, selectors = [
        '#descripcion',
        '#descripcion_salida',
        '#edit_descripcion',
        '#edit_descripcion_salida'
    ]) {
        selectors.forEach(sel => {
            const el = root.querySelector(sel);
            if (!el) return;
            el.dataset.tipShown = ''; // borra estado para la nueva instancia
            // El listener de foco era once:true; si se consumió, volvemos a armarlo:
            if (el._descTipHandler) {
                el.addEventListener('focus', el._descTipHandler, { once: true });
            }
        });

        // Nos aseguramos de que los inputs recién agregados (si los hubiera) queden configurados:
        setupDescriptionTips(root, { selectors });
        // El botón de info se puede re-enlazar sin problema (idempotente).
        bindDescriptionTipButtons(root);
    }

    // Exponer global
    window.setupDescriptionTips = setupDescriptionTips;
    window.resetDescriptionTips = resetDescriptionTips;
    window.bindDescriptionTipButtons = bindDescriptionTipButtons;
})();
