# patente_alcohol/views.py

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Solicitante, Ubicacion, SolicitudPatenteAlcohol, Cerro
import json


def patente_form(request):
    cerros = Cerro.objects.all()
    return render(request, "patente_alcohol/form.html", {"cerros": cerros})


@csrf_exempt
def create_solicitud_patente_alcohol(request):
    if request.method == "POST":
        data = json.loads(request.body)
        nombre = data.get("nombre")
        telefono = data.get("telefono")
        correo = data.get("correo")
        calle = data.get("calle")
        numero = data.get("numero")
        departamento = data.get("departamento")
        cerro_id = data.get("cerro_id")
        rol_avaluo = data.get("rol_avaluo")

        # Validar datos obligatorios
        if not nombre or not calle or not cerro_id or not rol_avaluo:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Por favor, complete todos los campos obligatorios.",
                }
            )

        # Crear Solicitante
        solicitante = Solicitante.objects.create(
            nombre=nombre, telefono=telefono, correo=correo
        )

        # Obtener Cerro
        try:
            cerro = Cerro.objects.get(id=cerro_id)
        except Cerro.DoesNotExist:
            return JsonResponse({"success": False, "message": "Cerro no válido."})

        # Crear SolicitudPatenteAlcohol
        solicitud = SolicitudPatenteAlcohol.objects.create(
            solicitante=solicitante, rol_avaluo=rol_avaluo
        )

        # Crear Ubicacion y asociarla con la SolicitudPatenteAlcohol
        ubicacion = Ubicacion.objects.create(
            calle=calle,
            numero=numero,
            departamento=departamento,
            cerro=cerro,
            solicitud=solicitud,
        )

        return JsonResponse(
            {"success": True, "message": "Solicitud creada exitosamente."}
        )

    return JsonResponse(
        {"success": False, "message": "Método no permitido."}, status=400
    )
