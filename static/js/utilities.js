// utilities.js

/**
 * Convierte el valor de un input a mayúsculas y elimina espacios extras.
 * @param {HTMLElement} input - Elemento de entrada (input) a estandarizar.
 */
function standardizeInput(input) {
    if (!input) return;
    input.value = input.value.toUpperCase().trim();
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
