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
        showUpload: false, // Desactiva el botón "Upload"
        showRemove: true,  // Muestra el botón "Remove"
        showPreview: true,
        showCaption: false,
        browseLabel: '<span class="material-symbols-outlined">upload_file</span> Seleccionar archivo',
        removeLabel: '<span class="material-symbols-outlined">delete</span> Eliminar', // Texto en español para el botón "Remove"
        mainClass: 'input-group-sm',
        dropZoneTitle: 'Arrastra y suelta los archivos aquí',
        fileActionSettings: {
            showRemove: true,
            showUpload: false,
            showZoom: false,
            showDrag: false
        },
        layoutTemplates: {
            close: '',
            indicator: '',
            actionDelete: '',
            actionUpload: ''
        }
    });

    salidaModal.style.display = 'block';

    salidaCloseButton.onclick = function () {
        salidaModal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };

    // Manejo del botón Guardar con validación y confirmación
    const saveButton = salidaModal.querySelector('button[type="submit"]');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío del formulario por defecto

        // Verificar si ambos campos están llenos
        const numeroSalida = document.getElementById('numero_salida').value;
        const archivoAdjuntoSalida = document.getElementById('salidaFileModalInput').files.length > 0;

        if (!numeroSalida || !archivoAdjuntoSalida) {
            Swal.fire({
                title: 'Error',
                text: 'Debe ingresar el número de salida y adjuntar un archivo.',
                icon: 'error',
                confirmButtonColor: '#E73C45',
                confirmButtonText: 'Aceptar'
            });
        } else {
            // Mostrar el mensaje de confirmación si los campos están llenos
            Swal.fire({
                title: '¿Desea confirmar la Salida?',
                text: "Se guardará el número y el archivo adjunto de salida.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4BBFE0',
                cancelButtonColor: '#E73C45',
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Si el usuario confirma, enviar el formulario
                    salidaModal.querySelector('form').submit();
                }
            });
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

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    // Manejo del botón Guardar con confirmación
    const saveButton = document.getElementById('guardarBNUP');
    saveButton.onclick = function (event) {
        event.preventDefault(); // Evita el envío del formulario por defecto

        const numeroIngreso = document.getElementById('numeroIngreso').value;
        const archivoAdjunto = document.getElementById('archivo_adjunto').files.length;

        if (!numeroIngreso || archivoAdjunto === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Complete todos los campos requeridos antes de enviar.',
            });
            return;
        }

        // Mostrar el mensaje de confirmación
        Swal.fire({
            title: '¿Desea confirmar la Solicitud de BNUP?',
            text: "Se guardará la solicitud junto con el archivo adjunto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4BBFE0',
            cancelButtonColor: '#E73C45',
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, enviar el formulario
                document.getElementById('bnupForm').submit();
            }
        });
    };
}




document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();
        initializeFileModal();
        initializeBNUPFormModal();
    }

    window.onclick = function (event) {
        const fileModal = document.getElementById('fileModal');
        const salidaModal = document.getElementById('salidaModal');

        if (event.target === fileModal) {
            fileModal.style.display = 'none';
        }

        if (event.target === salidaModal) {
            salidaModal.style.display = 'none';
        }
    };
});