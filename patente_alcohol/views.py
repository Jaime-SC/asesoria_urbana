# patente_alcohol/views.py

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Solicitante, Ubicacion, SolicitudPatenteAlcohol, Cerro, Salida
import json
from django.contrib.auth.decorators import login_required
import io
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from django.db import IntegrityError


def patente_form(request):
    cerros = Cerro.objects.all()
    solicitudes = []
    if request.user.is_authenticated:
        solicitudes = SolicitudPatenteAlcohol.objects.all().select_related(
            "solicitante", "ubicacion__cerro", "salida"
        )
    return render(
        request,
        "patente_alcohol/form.html",
        {"cerros": cerros, "solicitudes": solicitudes},
    )


@csrf_exempt
@login_required
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


@csrf_exempt
@login_required
def create_salida_patente_alcohol(request):
    if request.method == "POST":
        try:
            solicitud_id = request.POST.get("solicitud_id")
            numero_salida = request.POST.get("numero_salida")
            descripcion = request.POST.get("descripcion")
            archivo_adjunto_salida = request.FILES.get("archivo_adjunto_salida")

            # Validar datos obligatorios
            if not solicitud_id or not numero_salida or not descripcion:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Por favor, complete todos los campos obligatorios.",
                    }
                )

            # Obtener la solicitud
            try:
                solicitud = SolicitudPatenteAlcohol.objects.get(id=solicitud_id)
            except SolicitudPatenteAlcohol.DoesNotExist:
                return JsonResponse(
                    {"success": False, "message": "Solicitud no encontrada."},
                    status=404,
                )

            # Verificar si ya existe una Salida para esta Solicitud
            if hasattr(solicitud, "salida"):
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Ya existe una salida para esta solicitud.",
                    },
                    status=400,
                )

            # Verificar que el numero_salida no esté duplicado
            if Salida.objects.filter(numero_salida=numero_salida).exists():
                return JsonResponse(
                    {
                        "success": False,
                        "message": "El Número de Salida ya está en uso. Por favor, ingrese uno diferente.",
                    },
                    status=400,
                )

            # Crear Salida
            salida = Salida.objects.create(
                solicitud=solicitud,
                numero_salida=numero_salida,
                descripcion=descripcion,
                archivo_adjunto_salida=archivo_adjunto_salida,
            )

            # Preparar datos para la respuesta
            salida_data = {
                "id": salida.id,
                "numero_salida": salida.numero_salida,
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "descripcion": salida.descripcion,
                "archivo_adjunto_salida_url": (
                    salida.archivo_adjunto_salida.url
                    if salida.archivo_adjunto_salida
                    else ""
                ),
            }

            return JsonResponse(
                {
                    "success": True,
                    "message": "Salida agregada exitosamente.",
                    "salida": salida_data,
                }
            )

        except IntegrityError:
            # Manejar la excepción de unicidad a nivel de base de datos
            return JsonResponse(
                {
                    "success": False,
                    "message": "El Número de Salida ya está en uso. Por favor, ingrese uno diferente.",
                },
                status=400,
            )
        except Exception as e:
            return JsonResponse(
                {"success": False, "message": f"Error al agregar la salida: {str(e)}"},
                status=500,
            )

    return JsonResponse(
        {"success": False, "message": "Método no permitido."}, status=400
    )


@login_required
def get_salida_details(request, solicitud_id):
    try:
        salida = Salida.objects.select_related("solicitud").get(
            solicitud_id=solicitud_id
        )
        data = {
            "numero_salida": salida.numero_salida or "Sin número",
            "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
            "descripcion": salida.descripcion or "Sin descripción",
            "archivo_adjunto_salida_url": (
                salida.archivo_adjunto_salida.url
                if salida.archivo_adjunto_salida
                else None
            ),
        }
        return JsonResponse({"success": True, "data": data})
    except Salida.DoesNotExist:
        return JsonResponse(
            {"success": False, "message": "Salida no encontrada."}, status=404
        )


@csrf_exempt
@login_required
def update_numero_ingreso(request):
    if request.method == "POST":
        try:
            solicitud_id = request.POST.get("solicitud_id")
            numero_ingreso = request.POST.get("numero_ingreso").strip()

            # Validar datos obligatorios
            if not solicitud_id or not numero_ingreso:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Por favor, proporcione tanto el ID de la solicitud como el Número de Ingreso.",
                    },
                    status=400,
                )

            # Validar que el numero_ingreso no esté duplicado
            if (
                SolicitudPatenteAlcohol.objects.filter(numero_ingreso=numero_ingreso)
                .exclude(id=solicitud_id)
                .exists()
            ):
                return JsonResponse(
                    {
                        "success": False,
                        "message": "El Número de Ingreso ya está en uso. Por favor, ingrese uno diferente.",
                    },
                    status=400,
                )

            # Obtener la solicitud
            try:
                solicitud = SolicitudPatenteAlcohol.objects.get(id=solicitud_id)
            except SolicitudPatenteAlcohol.DoesNotExist:
                return JsonResponse(
                    {"success": False, "message": "Solicitud no encontrada."},
                    status=404,
                )

            # Actualizar el numero_ingreso
            solicitud.numero_ingreso = numero_ingreso
            solicitud.save()

            return JsonResponse(
                {
                    "success": True,
                    "message": "Número de Ingreso actualizado exitosamente.",
                    "numero_ingreso": solicitud.numero_ingreso,
                }
            )

        except Exception as e:
            return JsonResponse(
                {
                    "success": False,
                    "message": f"Error al actualizar el Número de Ingreso: {str(e)}",
                },
                status=500,
            )

    return JsonResponse(
        {"success": False, "message": "Método no permitido."},
        status=400,
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


@login_required
def generate_salida_pdf(request, solicitud_id):
    try:
        # Obtener la solicitud
        solicitud = SolicitudPatenteAlcohol.objects.select_related(
            "solicitante", "ubicacion__cerro"
        ).get(id=solicitud_id)

        # Obtener la salida relacionada
        salida = Salida.objects.get(solicitud=solicitud)

        # Preparar el contexto para la plantilla
        context = {
            "solicitud": {
                "numero_ingreso": solicitud.numero_ingreso or "Sin número",
                "rol_avaluo": solicitud.rol_avaluo,
                "fecha_ingreso": solicitud.fecha_ingreso,  # Pasar como objeto date
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
            },
            "salida": {
                "numero_salida": salida.numero_salida or "Sin número",
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "descripcion": salida.descripcion or "Sin descripción",
            },
        }

        # Renderizar el HTML usando la plantilla
        html_string = render_to_string("patente_alcohol/salida_pdf.html", context)

        css = CSS(
            string=f"""
            @page {{
                size: 1224px 820px;
                margin: 0; /* Ajustar márgenes si es necesario */
            }}
            body {{
                image-rendering: pixelated;
            }}
        """
        )

        # Generar el PDF
        html = HTML(string=html_string, base_url=request.build_absolute_uri())
        pdf = html.write_pdf(stylesheets=[css])

        # Crear una respuesta HTTP con el PDF
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="Salida_{solicitud_id}.pdf"'
        )

        return response

    except SolicitudPatenteAlcohol.DoesNotExist:
        return JsonResponse(
            {"success": False, "message": "Solicitud no encontrada."}, status=404
        )
    except Salida.DoesNotExist:
        return JsonResponse(
            {"success": False, "message": "Salida no encontrada para esta solicitud."},
            status=404,
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "message": f"Error al generar el PDF: {str(e)}"},
            status=500,
        )


@csrf_exempt
@login_required
def generate_combined_pdf(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            solicitud_ids = data.get("solicitud_ids", [])

            if not solicitud_ids:
                return JsonResponse(
                    {"success": False, "message": "No se seleccionaron solicitudes."},
                    status=400,
                )

            # Fetch solicitudes with numero_ingreso and salida
            solicitudes = SolicitudPatenteAlcohol.objects.filter(
                id__in=solicitud_ids
            ).select_related("solicitante", "ubicacion__cerro", "salida")

            # Validate that all selected solicitudes have numero_ingreso and salida
            invalid_solicitudes = [
                s.id
                for s in solicitudes
                if not s.numero_ingreso or not hasattr(s, "salida")
            ]
            if invalid_solicitudes:
                return JsonResponse(
                    {
                        "success": False,
                        "message": f"Las siguientes solicitudes no tienen número de ingreso o salida: {invalid_solicitudes}",
                    },
                    status=400,
                )

            # Prepare context
            context = {"solicitudes": solicitudes}

            # Render combined HTML
            html_string = render_to_string(
                "patente_alcohol/combined_salida_pdf.html", context
            )

            # Define CSS for Letter size and layout
            css = CSS(
                string="""
                @page {
                    size: 1224px 1640px;
                    margin: 0;

                }

                body {
                image-rendering: pixelated;
                }

                .page-container {
                    page-break-after: always;
                    margin-top: 1cm;

                }
                .solicitud {
                    page-break-inside: avoid;
                }

            """
            )

            # Generate PDF
            html = HTML(string=html_string, base_url=request.build_absolute_uri())
            pdf = html.write_pdf(stylesheets=[css])

            # Create HTTP response
            response = HttpResponse(pdf, content_type="application/pdf")
            response["Content-Disposition"] = (
                'attachment; filename="Solicitudes_Combinadas.pdf"'
            )

            return response

        except Exception as e:
            return JsonResponse(
                {
                    "success": False,
                    "message": f"Error al generar el PDF combinado: {str(e)}",
                },
                status=500,
            )

    return JsonResponse(
        {"success": False, "message": "Método no permitido."}, status=400
    )
