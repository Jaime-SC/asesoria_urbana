// static/js/egresos_au.js
(function () {
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
                initializeTable('tablaEgresosAU', 'paginationEgresosAU', 8, null);

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

            // validación número único
            const inputNumero = content.querySelector('#numero_egreso');
            const numeroError = content.querySelector('#error_numero');
            let numeroValido = false;
            inputNumero.addEventListener('blur', async () => {
                const num = inputNumero.value.trim();
                if (!num) return;
                const r = await fetch(`/bnup/egresos_au/validate_numero/?numero=${encodeURIComponent(num)}`);
                if (!r.ok) return;
                const { exists } = await r.json();
                if (exists) {
                    numeroError.style.display = 'block';
                    numeroValido = false;
                } else {
                    numeroError.style.display = 'none';
                    numeroValido = true;
                }
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

            // submit AJAX
            const form = content.querySelector('form');
            form.onsubmit = async evt => {
                evt.preventDefault();
                if (!numeroValido) {
                    inputNumero.focus();
                    return Swal.fire('Error', 'El número de egreso ya existe.', 'error');
                }
                const data = new FormData(form);
                const res = await fetch('/bnup/egresos_au_create/', {
                    method: 'POST',
                    body: data,
                    headers: { 'X-CSRFToken': getCSRFToken() }
                });
                const json = await res.json();
                if (json.success) {
                    cerrarFormModal();

                    // inserta fila nueva
                    const { numero_egreso, fecha_egreso, descripcion, funcionario, destinatario, archivo_url } = json.egreso;
                    const tabla = document.getElementById('tablaEgresosAU');
                    const tbody = tabla.querySelector('tbody');
                    const tr = document.createElement('tr');
                    tr.dataset.numero = numero_egreso;
                    tr.dataset.fecha = fecha_egreso;
                    tr.dataset.funcionario = funcionario;
                    tr.dataset.destinatario = destinatario;
                    tr.dataset.descripcion = descripcion;
                    tr.innerHTML = `
            <td>${numero_egreso}</td>
            <td>${fecha_egreso}</td>
            <td>${funcionario}</td>
            <td>${destinatario}</td>
            <td>
              <span class="descripcion-preview">
                ${descripcion || '—'}
                <span class="material-symbols-outlined preview-btn">preview</span>
              </span>
            </td>
            <td>${archivo_url
                            ? `<div class="icon-container">
                     <a href="${archivo_url}" target="_blank" style="text-decoration:none;">
                       <button class="buttonLogin buttonPreview">
                         <span class="material-symbols-outlined bell">find_in_page</span>
                       </button>
                     </a>
                     <div class="tooltip">Ver adjunto</div>
                   </div>`
                            : '—'
                        }</td>`;
                    tbody.insertBefore(tr, tbody.firstChild);
                    initializeTable('tablaEgresosAU', 'paginationEgresosAU', 8, null);

                    Swal.fire('Éxito', 'Egreso creado', 'success');
                } else {
                    Swal.fire('Error', json.error || 'Algo falló', 'error');
                }
            };

            return;
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
            modal.querySelector('#preview_funcionario').textContent = tr.dataset.funcionario;
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

        // 4) Volver a BNUP
        const btnBack = event.target.closest('#backToBNUP');
    if (btnBack) {
        event.preventDefault();
        const bnupLink = document.querySelector('a[data-content="BNUP"]');
        if (bnupLink) bnupLink.click();
        return;
    }
});
}) ();
