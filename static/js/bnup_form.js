// D:\Documents\proyectosWeb\asesoriaUrbana\static\js\bnup_form.js

function initializeFileModal() {
    const modalButton = document.getElementById('openFileModal');
    const closeModalButton = document.querySelector('.close');
    const fileModalInput = document.getElementById('fileModalInput');
    const archivoAdjuntoInput = document.getElementById('archivo_adjunto');

    if (modalButton) {
        modalButton.onclick = function () {
            document.getElementById('fileModal').style.display = 'block';
        };
    }

    if (closeModalButton) {
        closeModalButton.onclick = function () {
            document.getElementById('fileModal').style.display = 'none';
        };
    }

    window.onclick = function (event) {
        if (event.target === document.getElementById('fileModal')) {
            document.getElementById('fileModal').style.display = 'none';
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
        initializeFileModal(); // Asegúrate de que initializeFileModal se ejecute cuando se cargue el formulario BNUP
    }
});
