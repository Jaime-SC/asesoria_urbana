function initializeFileModal() {
    const modalButton = document.getElementById('openFileModal');
    const closeModalButton = document.querySelector('#fileModal .close');
    const fileModal = document.getElementById('fileModal');
    const fileModalInput = document.getElementById('fileModalInput');
    const archivoAdjuntoInput = document.getElementById('archivo_adjunto');

    if (modalButton) {
        modalButton.onclick = function () {
            fileModal.style.display = 'block';
        };
    }

    if (closeModalButton) {
        closeModalButton.onclick = function () {
            fileModal.style.display = 'none';
        };
    }

    window.onclick = function (event) {
        if (event.target === fileModal) {
            fileModal.style.display = 'none';
        }
    };

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

    salidaModal.style.display = 'block';

    // Cerrar el modal cuando se presiona la 'X'
    salidaCloseButton.onclick = function () {
        salidaModal.style.display = 'none';
    };

    // Cerrar el modal si se hace clic fuera de él
    window.onclick = function (event) {
        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };
}

function updateBNUPFields() {
    const memoRadio = document.getElementById('memo');
    const correoRadio = document.getElementById('correo');
    const memoFields = document.getElementById('memoFields');
    const correoFields = document.getElementById('correoFields');

    function toggleFields() {
        if (memoRadio.checked) {
            memoFields.style.display = 'block';
            correoFields.style.display = 'none';
        } else if (correoRadio.checked) {
            memoFields.style.display = 'none';
            correoFields.style.display = 'block';
        }
    }

    if (memoRadio && correoRadio) {
        memoRadio.addEventListener('change', toggleFields);
        correoRadio.addEventListener('change', toggleFields);

        toggleFields();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();
        initializeFileModal();
    }

    window.onclick = function (event) {
        const fileModal = document.getElementById('fileModal');
        const salidaModal = document.getElementById('salidaModal');

        // Cerrar el modal de ingreso si se hace clic fuera de él
        if (event.target === fileModal) {
            fileModal.style.display = 'none';
        }

        // Cerrar el modal de salida si se hace clic fuera de él
        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };
});