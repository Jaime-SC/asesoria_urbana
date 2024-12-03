# patente_alcohol/views.py

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Solicitante, Ubicacion, SolicitudPatenteAlcohol, Cerro
import json
from django.contrib.auth.decorators import login_required


def patente_form(request):
    cerros = Cerro.objects.all()
    solicitudes = []
    if request.user.is_authenticated:
        solicitudes = SolicitudPatenteAlcohol.objects.all().select_related(
            "solicitante", "ubicacion__cerro"
        )
    return render(
        request,
        "patente_alcohol/form.html",
        {"cerros": cerros, "solicitudes": solicitudes},
    )


@csrf_exempt
def create_solicitud_patente_alcohol(request):
    if request.method == "POST":
        try:
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

            # Preparar datos para la respuesta
            solicitud_data = {
                "numero_ingreso": solicitud.numero_ingreso or "Sin número",
                "rol_avaluo": solicitud.rol_avaluo,
                "fecha_ingreso": solicitud.fecha_ingreso.strftime("%d/%m/%Y"),
                "solicitante": solicitante.nombre,
                "telefono": solicitante.telefono or "No proporcionado",
                "correo": solicitante.correo or "No proporcionado",
                "calle": ubicacion.calle,
                "numero": ubicacion.numero or "No proporcionado",
                "departamento": ubicacion.departamento or "No proporcionado",
                "cerro": cerro.nombre if cerro else "No asignado",
                "id": solicitud.id,
            }

            return JsonResponse(
                {
                    "success": True,
                    "message": "Solicitud creada exitosamente.",
                    "solicitud": solicitud_data,
                }
            )

        except Exception as e:
            return JsonResponse(
                {"success": False, "message": f"Error al crear la solicitud: {str(e)}"},
                status=500,
            )

    return JsonResponse(
        {"success": False, "message": "Método no permitido."}, status=400
    )


@login_required
def get_solicitud_details(request, solicitud_id):
    try:
        solicitud = SolicitudPatenteAlcohol.objects.select_related(
            "solicitante", "ubicacion__cerro"
        ).get(id=solicitud_id)
        data = {
            "numero_ingreso": solicitud.numero_ingreso or "Sin número",
            "rol_avaluo": solicitud.rol_avaluo,
            "fecha_ingreso": solicitud.fecha_ingreso.strftime("%d/%m/%Y"),
            "solicitante": solicitud.solicitante.nombre,
            "telefono": solicitud.solicitante.telefono or "No proporcionado",
            "correo": solicitud.solicitante.correo or "No proporcionado",
            "calle": solicitud.ubicacion.calle,
            "numero": solicitud.ubicacion.numero or "No proporcionado",
            "departamento": solicitud.ubicacion.departamento or "No proporcionado",
            "cerro": (
                solicitud.ubicacion.cerro.nombre
                if solicitud.ubicacion.cerro
                else "No asignado"
            ),
            # Añade más campos si es necesario
        }
        return JsonResponse({"success": True, "data": data})
    except SolicitudPatenteAlcohol.DoesNotExist:
        return JsonResponse(
            {"success": False, "message": "Solicitud no encontrada."}, status=404
        )
