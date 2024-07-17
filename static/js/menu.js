document.addEventListener("DOMContentLoaded", function() {
    const menuLinks = document.querySelectorAll('.menu a');
    const titleDiv = document.getElementById('title');
    const descriptionDiv = document.getElementById('description');
    const contentMenu = document.querySelector('.contentMenu');
    const cardMain = document.querySelector('.cardMain');
    const ulMenu = document.querySelector('.ulMenu');
    
    


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
            contentMenu.style.background = 'rgba(255, 255, 255, 0.5)'; // Fondo al hacer hover
        });

        link.addEventListener('mouseleave', function() {
            // No hacer nada si hay contenido activo
            if (currentActiveContent === null) {
                titleDiv.innerHTML = '<h1>Asesoría Urbana</h1>';
                descriptionDiv.innerHTML = '<p style="font-weight: bold;">¿Quiénes son?</p><br /><p>Tiene como objetivo asesorar al Alcalde y al Concejo en la promoción del Desarrollo Urbano. Artículo 56° Departamento de Asesoría Urbana.</p><br /><p style="font-weight: bold;">Las funciones generales del Departamento son:</p><br /><ul style="margin-left: 20px"><li>Estudiar y elaborar el Plan Regulador Comunal, y mantenerlo actualizado, promoviendo las modificaciones necesarias, y preparar los planes seccionales para su aplicación.</li><br /><li>Informar técnicamente las proposiciones sobre Planificación Urbana Intercomunal, formuladas a la Municipalidad por la Secretaría Regional Ministerial de Vivienda y Urbanismo.</li><br /><li>Proponer al Alcalde y al Concejo proyectos de Ordenamiento Territorial, compatibilizados con los Planes de Desarrollo Comunal y Desarrollo Regional, proyectos de remodelación y conservación de espacios públicos y vialidad, para promover al Desarrollo Urbano de la comuna.</li><br /><li>Informar técnicamente las proposiciones sobre Planificación Urbana Intercomunal formuladas al Municipio por la Secretaria Regional Ministerial de Vivienda y Urbanismo.</li><br /><li>Generar y/o gestionar la elaboración de un Plan de Ordenamiento Territorial para la comuna.</li><br /><li>Definir y estructurar las definiciones de uso de suelo rural y urbano.</li><br /><li>La Dirección de Vivienda, Barrio y Territorio será colaboradora y/o proponente en el proceso de actualización del Plan Regulador Comunal.</li></ul><br /><p style="font-weight: bold;">¿Cómo contactarlos?</p><br /><p>Puedes visitar su sitio web o contactarlos directamente a través de sus canales de atención al público.</p><br /><p style="font-weight: bold;">¿Recursos adicionales?</p><br /><p>Sitio web SECPLA:<a href="https://www.munivalpo.cl/repositorio/Municipio/secpla.aspx" target="_blank" style="font-weight: bold;color: crimson;">https://www.munivalpo.cl/repositorio/Municipio/secpla.aspx</a></p><br /><p>Ley General de Urbanismo y Construcciones (LGUC):<a href="https://www.leychile.cl/navegar?idNorma=13560" target="_blank" style="font-weight: bold;color: crimson;">https://www.leychile.cl/navegar?idNorma=13560</a></p><br /><p>Ordenanza General de Urbanismo y Construcciones (OGUC):<a href="https://www.leychile.cl/navegar?idNorma=8201" target="_blank" style="font-weight: bold;color: crimson;">https://www.leychile.cl/navegar?idNorma=8201</a></p>';
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
            contentMenu.style.background = 'rgba(255, 255, 255, 0.5)'; // Mantener el fondo

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
        if (!ulMenu.contains(event.target) && !contentMenu.contains(event.target)) {
            currentActiveContent = null; // Limpiar contenido activo

            // Cambiar el fondo a transparente con una transición
            contentMenu.style.transition = 'background 0.5s ease'; // Asegurarse de que la transición está activa
            contentMenu.style.background = 'transparent'; // Fondo transparente

            // Restaurar título y descripción
            titleDiv.innerHTML = '<h1>Asesoría Urbana</h1>';
            descriptionDiv.innerHTML = '<p style="font-weight: bold;">¿Quiénes son?</p><br /><p>Tiene como objetivo asesorar al Alcalde y al Concejo en la promoción del Desarrollo Urbano. Artículo 56° Departamento de Asesoría Urbana.</p><br /><p style="font-weight: bold;">Las funciones generales del Departamento son:</p><br /><ul style="margin-left: 20px"><li>Estudiar y elaborar el Plan Regulador Comunal, y mantenerlo actualizado, promoviendo las modificaciones necesarias, y preparar los planes seccionales para su aplicación.</li><br /><li>Informar técnicamente las proposiciones sobre Planificación Urbana Intercomunal, formuladas a la Municipalidad por la Secretaría Regional Ministerial de Vivienda y Urbanismo.</li><br /><li>Proponer al Alcalde y al Concejo proyectos de Ordenamiento Territorial, compatibilizados con los Planes de Desarrollo Comunal y Desarrollo Regional, proyectos de remodelación y conservación de espacios públicos y vialidad, para promover al Desarrollo Urbano de la comuna.</li><br /><li>Informar técnicamente las proposiciones sobre Planificación Urbana Intercomunal formuladas al Municipio por la Secretaria Regional Ministerial de Vivienda y Urbanismo.</li><br /><li>Generar y/o gestionar la elaboración de un Plan de Ordenamiento Territorial para la comuna.</li><br /><li>Definir y estructurar las definiciones de uso de suelo rural y urbano.</li><br /><li>La Dirección de Vivienda, Barrio y Territorio será colaboradora y/o proponente en el proceso de actualización del Plan Regulador Comunal.</li></ul><br /><p style="font-weight: bold;">¿Cómo contactarlos?</p><br /><p>Puedes visitar su sitio web o contactarlos directamente a través de sus canales de atención al público.</p><br /><p style="font-weight: bold;">¿Recursos adicionales?</p><br /><p>Sitio web SECPLA:<a href="https://www.munivalpo.cl/repositorio/Municipio/secpla.aspx" target="_blank" style="font-weight: bold;color: crimson;">https://www.munivalpo.cl/repositorio/Municipio/secpla.aspx</a></p><br /><p>Ley General de Urbanismo y Construcciones (LGUC):<a href="https://www.leychile.cl/navegar?idNorma=13560" target="_blank" style="font-weight: bold;color: crimson;">https://www.leychile.cl/navegar?idNorma=13560</a></p><br /><p>Ordenanza General de Urbanismo y Construcciones (OGUC):<a href="https://www.leychile.cl/navegar?idNorma=8201" target="_blank" style="font-weight: bold;color: crimson;">https://www.leychile.cl/navegar?idNorma=8201</a></p>';
            // Remover la clase de brillo
            cardMain.classList.remove('bright');

            // Limpiar la clase active de todos los enlaces
            menuLinks.forEach(link => link.classList.remove('active'));
        }
    });

});
