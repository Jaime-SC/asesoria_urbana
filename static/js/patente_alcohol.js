// static/js/patente_alcohol.js

document.addEventListener('DOMContentLoaded', function () {
    initializePatenteAlcoholForm();
});

function initializePatenteAlcoholForm() {
    const patenteForm = document.getElementById('patenteForm');

    // Estandarizar inputs
    initializeStandardizeInputs();

    patenteForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Obtener token CSRF
        const csrftoken = getCSRFToken();

        // Recolectar datos del formulario
        const formData = {
            'nombre': document.getElementById('nombre').value.trim(),
            'telefono': document.getElementById('telefono').value.trim(),
            'correo': document.getElementById('correo').value.trim(),
            'calle': document.getElementById('calle').value.trim(),
            'numero': document.getElementById('numero').value.trim(),
            'departamento': document.getElementById('departamento').value.trim(),
            'cerro_id': document.getElementById('cerro').value,
            'rol_avaluo': document.getElementById('rol_avaluo').value.trim(),
        };

        // Validar campos obligatorios
        if (!formData.nombre || !formData.calle || !formData.cerro_id || !formData.rol_avaluo) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor, complete todos los campos obligatorios.',
            });
            return;
        }

        fetch('/patente_alcohol/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(formData),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Solicitud creada exitosamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    patenteForm.reset();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error al crear la solicitud.',
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al enviar la solicitud.',
                });
            });
    });
}
