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

        // Initialize the correct field visibility on page load
        toggleFields();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('#bnupForm')) {
        updateBNUPFields();
    }
});

$(document).ready(function() {
    $("#archivo_adjunto").fileinput({
        showUpload: false, // Oculta el botón de subir archivos (solo selecciona archivos)
        showPreview: false, // Oculta la previsualización de la imagen
        browseClass: "btn btn-primary", // Estilo del botón de selección
        browseLabel: "Seleccionar archivo",
        removeLabel: "Eliminar",
        removeClass: "btn btn-danger",
        language: "es", // Establece el idioma a español
    });
});