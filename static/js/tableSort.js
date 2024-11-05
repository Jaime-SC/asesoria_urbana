// tableSort.js

/**
 * Abre el modal de descripción con los datos proporcionados.
 * @param {string} descripcion - El texto de la descripción.
 * @param {string} nombre - El nombre del solicitante.
 * @param {string} fecha - La fecha de la solicitud.
 * @param {string} numero_ingreso - El número de ingreso.
 * @param {string} correo_solicitante - El correo del solicitante.
 * @param {string} departamento - El departamento del solicitante.
 * @param {string} funcionario_asignado - El funcionario asignado.
 * @param {string} tablaOrigen - El identificador de la tabla de origen.
 */
window.openDescripcionModal = function (descripcion, nombre, fecha, numero_ingreso, correo_solicitante, departamento, funcionario_asignado, tablaOrigen) {
    const modal = document.getElementById('descripcionModal');
    const descripcionCompleta = document.getElementById('descripcionCompleta');
    const nombreCompleto = document.getElementById('nombreCompleto');
    const fechaIngreso = document.getElementById('fechaIngreso');
    const numeroIngresoSpan = document.getElementById('numero_ingreso');
    const correoSolicitante = document.getElementById('correo_solicitante');
    const deptoSolicitante = document.getElementById('deptoSolicitante');
    const funcionarioAsignado = document.getElementById('funcionario_asignado');
    const correoField = document.getElementById('correoField');

    // Rellenar los campos del modal con los datos proporcionados
    descripcionCompleta.textContent = descripcion;
    nombreCompleto.textContent = nombre;
    fechaIngreso.textContent = fecha;
    numeroIngresoSpan.textContent = numero_ingreso;
    deptoSolicitante.textContent = departamento;
    funcionarioAsignado.textContent = funcionario_asignado;

    // Mostrar u ocultar el campo de correo según la tabla de origen
    if (tablaOrigen === 'tablaSolicitudesCorreo') {
        correoSolicitante.textContent = correo_solicitante;
        correoField.style.display = 'flex';
    } else {
        correoField.style.display = 'none';
    }

    modal.style.display = 'block';
};

/**
 * Cierra el modal de descripción.
 */
window.closeDescripcionModal = function () {
    const modal = document.getElementById('descripcionModal');
    modal.style.display = 'none';
};

// Cerrar el modal de descripción si se hace clic fuera de él
document.addEventListener('click', function (event) {
    const modal = document.getElementById('descripcionModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
