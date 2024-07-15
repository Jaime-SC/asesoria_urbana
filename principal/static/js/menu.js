document.addEventListener("DOMContentLoaded", function() {
    const menuLinks = document.querySelectorAll('.menu a');
    const titleDiv = document.getElementById('title');
    const descriptionDiv = document.getElementById('description');
    const contentMenu = document.querySelector('.contentMenu');
    const cardMain = document.querySelector('.cardMain');

    let currentActiveContent = null; // Para almacenar el contenido actualmente activo

    menuLinks.forEach(link => {
        link.addEventListener('mouseover', function() {
            const content = this.getAttribute('data-content');

            // Cambiar título y descripción solo si no hay contenido activo
            if (currentActiveContent === null) {
                titleDiv.innerHTML = `<h1>${content}</h1>`;
                descriptionDiv.innerHTML = `<p>Descripción de ${content}...</p>`;
            }

            // Cambiar fondo de contentMenu solo cuando se hace hover en el enlace
            contentMenu.style.background = 'rgba(0, 0, 0, 0.5)'; // Fondo al hacer hover
        });

        link.addEventListener('mouseleave', function() {
            // No hacer nada si hay contenido activo
            if (currentActiveContent === null) {
                titleDiv.innerHTML = '<h1>Asesoria Urbana</h1>';
                descriptionDiv.innerHTML = '<p>Una breve descripción sobre la asesoría urbana.</p>';
                contentMenu.style.background = 'transparent'; // Fondo transparente
            }
        });

        link.addEventListener('click', function() {
            const content = this.getAttribute('data-content');
            currentActiveContent = content; // Establecer el contenido activo

            // Limpiar la clase active de todos los enlaces
            menuLinks.forEach(link => link.classList.remove('active'));

            // Añadir la clase active al enlace clicado
            this.classList.add('active');

            // Cambiar fondo de contentMenu al hacer clic
            contentMenu.style.background = 'rgba(0, 0, 0, 0.5)'; // Mantener el fondo

            // Cambiar título y descripción según el enlace clicado
            titleDiv.innerHTML = `<h1>${content}</h1>`;
            descriptionDiv.innerHTML = `<p>Descripción de ${content}...</p>`;

            // Añadir clase de brillo al cardMain
            cardMain.classList.add('bright');
        });
    });

    // Prevenir que el fondo de contentMenu se mantenga al pasar el mouse sobre él
    contentMenu.addEventListener('mouseover', function() {
        // No hacer nada al pasar el mouse sobre contentMenu
    });

    contentMenu.addEventListener('mouseleave', function() {
        // Restaurar fondo al salir, solo si no hay hover en un enlace
        if (currentActiveContent === null) {
            contentMenu.style.background = 'transparent'; // Fondo transparente
        }
    });

    // Evento para cerrar el hover al hacer clic fuera de cardMain
    document.addEventListener('click', function(event) {
        if (!cardMain.contains(event.target)) {
            currentActiveContent = null; // Limpiar contenido activo

            // Cambiar el fondo a transparente con una transición
            contentMenu.style.transition = 'background 0.5s ease'; // Asegurarse de que la transición está activa
            contentMenu.style.background = 'transparent'; // Fondo transparente

            // Restaurar título y descripción
            titleDiv.innerHTML = '<h1>Asesoria Urbana</h1>';
            descriptionDiv.innerHTML = '<p>Una breve descripción sobre la asesoría urbana.</p>';

            // Remover la clase de brillo
            cardMain.classList.remove('bright');

            // Limpiar la clase active de todos los enlaces
            menuLinks.forEach(link => link.classList.remove('active'));
        }
    });

});
