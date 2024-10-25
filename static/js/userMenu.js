// userMenu.js

document.addEventListener('DOMContentLoaded', function () {
    const userIdentificador = document.getElementById('userIdentificador');
    const userMenu = document.getElementById('userMenu');
    const changePasswordOption = document.getElementById('changePasswordOption');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
    const successMessage = document.querySelector('.messages li.success');
    
    if (successMessage && changePasswordModal) {
        // Cerrar el modal después de mostrar el mensaje
        setTimeout(function () {
            changePasswordModal.style.display = 'none';
        }, 2000); // Cerrar después de 2 segundos
    }

    if (userIdentificador && userMenu) {
        // Ocultar el menú inicialmente
        userMenu.style.display = 'none';

        // Evento para mostrar/ocultar el menú al hacer clic en userIdentificador
        userIdentificador.addEventListener('click', function (event) {
            event.stopPropagation(); // Evitar que el clic se propague al documento
            if (userMenu.style.display === 'none') {
                userMenu.style.display = 'block';
            } else {
                userMenu.style.display = 'none';
            }
        });

        // Ocultar el menú si se hace clic fuera de él
        document.addEventListener('click', function () {
            userMenu.style.display = 'none';
        });

        // Evento para abrir el modal de cambio de contraseña
        if (changePasswordOption && changePasswordModal) {
            changePasswordOption.addEventListener('click', function (event) {
                event.stopPropagation(); // Evitar que el clic se propague al documento
                userMenu.style.display = 'none'; // Ocultar el menú
                changePasswordModal.style.display = 'block'; // Mostrar el modal
            });
        }

        // Evento para cerrar el modal al hacer clic en la 'x'
        if (closeChangePasswordModal) {
            closeChangePasswordModal.addEventListener('click', function () {
                changePasswordModal.style.display = 'none';
            });
        }

        // Evento para cerrar el modal al hacer clic fuera de él
        window.addEventListener('click', function (event) {
            if (event.target === changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });
    }
});
