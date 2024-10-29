/**
 * Convierte el valor de un input a mayúsculas, elimina espacios extras y quita tildes.
 * @param {HTMLElement} input - Elemento de entrada (input) a estandarizar.
 */
function standardizeInput(input) {
    if (!input) return;

    let value = input.value;

    // 1. Eliminar tildes y acentos
    value = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Convertir a mayúsculas
    value = value.toUpperCase();

    // 3. Eliminar espacios al inicio y al final, y reducir múltiples espacios a uno solo
    value = value.trim().replace(/\s+/g, ' ');

    input.value = value;
}


/**
 * Inicializa la estandarización de inputs con la clase 'standardize-input'.
 */
function initializeStandardizeInputs() {
    const standardInputs = document.querySelectorAll('.standardize-input');
    standardInputs.forEach(input => {
        // Estandarizar al perder el foco
        input.addEventListener('blur', () => {
            standardizeInput(input);
        });

        // Opcional: Estandarizar en tiempo real mientras se escribe
        // input.addEventListener('input', () => {
        //     standardizeInput(input);
        // });
    });
}