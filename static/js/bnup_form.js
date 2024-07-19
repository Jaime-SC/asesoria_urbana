document.addEventListener('DOMContentLoaded', function() {
    // Función para inicializar los manejadores del formulario
    function initFormHandlers() {
        var recepcionSelect = document.getElementById('recepcion');
        var correoSection = document.getElementById('correo-section');
        var memoSection = document.getElementById('memo-section');

        if (!recepcionSelect || !correoSection || !memoSection) {
            console.error('Error: No se pudo encontrar uno o más elementos.');
            return;
        }

        console.log('Script cargado correctamente');
        console.log('Elementos encontrados:', {
            recepcionSelect: recepcionSelect,
            correoSection: correoSection,
            memoSection: memoSection
        });

        recepcionSelect.addEventListener('change', function() {
            console.log('Opción seleccionada: ', this.value);
            if (this.value === 'correo') {
                console.log('Mostrar sección de correo');
                correoSection.style.display = 'block';
                memoSection.style.display = 'none';
            } else if (this.value === 'memo') {
                console.log('Mostrar sección de memo');
                correoSection.style.display = 'none';
                memoSection.style.display = 'block';
            } else {
                console.log('Ocultar ambas secciones');
                correoSection.style.display = 'none';
                memoSection.style.display = 'none';
            }
        });
    }

    // Configurar MutationObserver para observar cambios en el contenido
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                initFormHandlers();
            }
        });
    });

    // Observar el contenedor de contenido
    var contentDiv = document.getElementById('content');
    if (contentDiv) {
        observer.observe(contentDiv, { childList: true, subtree: true });
        // Inicializar los manejadores al cargar el script
        initFormHandlers();
    } else {
        console.error('No se encontró el contenedor de contenido.');
    }
});
