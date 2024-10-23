import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Count
from django.db.models.functions import ExtractYear, ExtractMonth
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse, HttpResponseRedirect

from principal.models import PerfilUsuario
from .models import SalidaBNUP, SolicitudBNUP, Departamento, Funcionario, TipoRecepcion


def bnup_form(request):
    """
    Maneja la visualización y creación de solicitudes de BNUP.
    - GET: Renderiza el formulario con datos necesarios.
    - POST: Procesa y guarda una nueva solicitud de BNUP.
    """
    if not request.user.is_authenticated:
        return redirect("login")

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if request.method == "POST":
        if tipo_usuario not in ["ADMIN", "PRIVILEGIADO"]:
            messages.error(request, "No tiene permiso para crear solicitudes de BNUP.")
            return redirect("bnup_form")

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        numero_memo = request.POST.get("num_memo") if tipo_recepcion_id != "2" else None
        correo_solicitante = request.POST.get("correo_solicitante") if tipo_recepcion_id == "2" else None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        nombre_solicitante = request.POST.get("nombre_solicitante")
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso = request.POST.get("fecha_ingreso")
        funcionario_asignado_id = request.POST.get("funcionario_asignado")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)
            funcionario_asignado = Funcionario.objects.get(id=funcionario_asignado_id)

            solicitud = SolicitudBNUP(
                tipo_recepcion=tipo_recepcion,
                numero_memo=numero_memo,
                correo_solicitante=correo_solicitante,
                depto_solicitante=depto_solicitante,
                nombre_solicitante=nombre_solicitante,
                numero_ingreso=numero_ingreso,
                fecha_ingreso=fecha_ingreso,
                funcionario_asignado=funcionario_asignado,
                descripcion=descripcion,
                archivo_adjunto_ingreso=archivo_adjunto,
            )
            solicitud.save()
            request.session["redirect_to_bnup"] = True
            return redirect("home")
        except TipoRecepcion.DoesNotExist:
            messages.error(request, "Tipo de recepción inválido.")
        except Departamento.DoesNotExist:
            messages.error(request, "Departamento solicitante inválido.")
        except Funcionario.DoesNotExist:
            messages.error(request, "Funcionario asignado inválido.")
        except Exception as e:
            messages.error(request, f"Error al guardar la solicitud: {e}")

        return redirect("home")
    else:
        solicitudes = SolicitudBNUP.objects.filter(is_active=True).select_related("tipo_recepcion")
        departamentos = Departamento.objects.all()
        funcionarios = Funcionario.objects.all()
        tipos_recepcion = TipoRecepcion.objects.all()

        context = {
            "departamentos": departamentos,
            "funcionarios": funcionarios,
            "solicitudes": solicitudes,
            "tipos_recepcion": tipos_recepcion,
            "tipo_usuario": tipo_usuario,
        }
        return render(request, "bnup/form.html", context)


def edit_bnup_record(request):
    """
    Maneja la edición de una solicitud de BNUP.
    - POST: Actualiza una solicitud existente.
    - GET: Devuelve los datos de una solicitud en formato JSON.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "No autenticado."})

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if tipo_usuario not in ["ADMIN", "PRIVILEGIADO"]:
        return JsonResponse({"success": False, "error": "No tiene permiso para editar registros."})

    if request.method == "POST":
        solicitud_id = request.POST.get("solicitud_id")
        solicitud = get_object_or_404(SolicitudBNUP, id=solicitud_id)

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        numero_memo = request.POST.get("num_memo") if tipo_recepcion_id != "2" else None
        correo_solicitante = request.POST.get("correo_solicitante") if tipo_recepcion_id == "2" else None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        nombre_solicitante = request.POST.get("nombre_solicitante")
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso = request.POST.get("fecha_ingreso")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)

            solicitud.tipo_recepcion = tipo_recepcion
            solicitud.numero_memo = numero_memo
            solicitud.correo_solicitante = correo_solicitante
            solicitud.depto_solicitante = depto_solicitante
            solicitud.nombre_solicitante = nombre_solicitante
            solicitud.numero_ingreso = numero_ingreso
            solicitud.fecha_ingreso = fecha_ingreso
            solicitud.descripcion = descripcion

            if archivo_adjunto:
                solicitud.archivo_adjunto_ingreso = archivo_adjunto

            solicitud.save()

            return JsonResponse({"success": True, "data": {"id": solicitud.id}})
        except TipoRecepcion.DoesNotExist:
            return JsonResponse({"success": False, "error": "Tipo de recepción inválido."})
        except Departamento.DoesNotExist:
            return JsonResponse({"success": False, "error": "Departamento solicitante inválido."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    else:
        solicitud_id = request.GET.get("solicitud_id")
        solicitud = get_object_or_404(SolicitudBNUP, id=solicitud_id)

        data = {
            "id": solicitud.id,
            "tipo_recepcion": solicitud.tipo_recepcion.id,
            "numero_memo": solicitud.numero_memo,
            "correo_solicitante": solicitud.correo_solicitante,
            "depto_solicitante": solicitud.depto_solicitante.id,
            "nombre_solicitante": solicitud.nombre_solicitante,
            "numero_ingreso": solicitud.numero_ingreso,
            "fecha_ingreso": solicitud.fecha_ingreso.strftime("%Y-%m-%d"),
            "funcionario_asignado": solicitud.funcionario_asignado.id,
            "descripcion": solicitud.descripcion,
        }

        return JsonResponse({"success": True, "data": data})


def delete_bnup_records(request):
    """
    Maneja la eliminación lógica de solicitudes de BNUP.
    - POST: Marca las solicitudes como inactivas.
    """
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "error": "No autenticado."})

        perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
        tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

        if tipo_usuario != "ADMIN":
            return JsonResponse({"success": False, "error": "No tiene permiso para eliminar registros."})

        try:
            data = json.loads(request.body)
            ids = data.get("ids", [])

            SolicitudBNUP.objects.filter(id__in=ids).update(is_active=False)
            return JsonResponse({"success": True})
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Datos inválidos."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})


def statistics_view(request):
    """
    Genera estadísticas relacionadas con las solicitudes de BNUP.
    """
    if not request.user.is_authenticated:
        return redirect("login")

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if tipo_usuario not in ["ADMIN", "PRIVILEGIADO"]:
        messages.error(request, "No tiene permiso para ver las estadísticas.")
        return redirect("bnup_form")

    solicitudes_por_depto = SolicitudBNUP.objects.values("depto_solicitante__nombre").annotate(total=Count("id"))
    solicitudes_por_funcionario = SolicitudBNUP.objects.values("funcionario_asignado__nombre").annotate(total=Count("id"))
    solicitudes_por_tipo = SolicitudBNUP.objects.values("tipo_recepcion__tipo").annotate(total=Count("id"))
    solicitudes_por_anio = (
        SolicitudBNUP.objects.annotate(anio=ExtractYear("fecha_ingreso"))
        .values("anio")
        .annotate(total=Count("id"))
    )
    solicitudes_por_mes = (
        SolicitudBNUP.objects.annotate(mes=ExtractMonth("fecha_ingreso"))
        .values("mes")
        .annotate(total=Count("id"))
    )

    total_solicitudes = SolicitudBNUP.objects.count()
    total_salidas = SalidaBNUP.objects.count()

    context = {
        "solicitudes_por_depto": json.dumps(
            {item["depto_solicitante__nombre"]: item["total"] for item in solicitudes_por_depto},
            cls=DjangoJSONEncoder,
        ),
        "solicitudes_por_funcionario": json.dumps(
            {item["funcionario_asignado__nombre"]: item["total"] for item in solicitudes_por_funcionario},
            cls=DjangoJSONEncoder,
        ),
        "solicitudes_por_tipo": json.dumps(
            {item["tipo_recepcion__tipo"]: item["total"] for item in solicitudes_por_tipo},
            cls=DjangoJSONEncoder,
        ),
        "solicitudes_por_anio": json.dumps(
            {str(int(item["anio"])): item["total"] for item in solicitudes_por_anio},
            cls=DjangoJSONEncoder,
        ),
        "solicitudes_por_mes": json.dumps(
            {str(int(item["mes"])): item["total"] for item in solicitudes_por_mes},
            cls=DjangoJSONEncoder,
        ),
        "total_solicitudes": total_solicitudes,
        "total_salidas": total_salidas,
    }

    return render(request, "bnup/statistics.html", context)


def get_salidas(request, solicitud_id):
    """
    Devuelve las salidas asociadas a una solicitud específica en formato JSON.
    """
    if request.method == "GET":
        salidas = SalidaBNUP.objects.filter(solicitud_bnup_id=solicitud_id)
        salidas_data = [
            {
                "numero_salida": salida.numero_salida,
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else "",
            }
            for salida in salidas
        ]
        return JsonResponse({"success": True, "salidas": salidas_data})
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})


def create_salida(request):
    """
    Crea una nueva salida asociada a una solicitud de BNUP.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "No autenticado."})

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if tipo_usuario not in ["ADMIN", "PRIVILEGIADO", "ALIMENTADOR"]:
        return JsonResponse({"success": False, "error": "No tiene permiso para crear salidas."})

    if request.method == "POST":
        solicitud_id = request.POST.get("solicitud_id")
        numero_salida = request.POST.get("numero_salida")
        fecha_salida = request.POST.get("fecha_salida")
        archivo_adjunto_salida = request.FILES.get("archivo_adjunto_salida")

        try:
            solicitud = get_object_or_404(SolicitudBNUP, id=solicitud_id)
            salida = SalidaBNUP(
                solicitud_bnup=solicitud,
                numero_salida=numero_salida,
                fecha_salida=fecha_salida,
                archivo_adjunto_salida=archivo_adjunto_salida,
            )
            salida.save()

            messages.success(request, "Salida creada exitosamente.")
            return redirect(request.META.get("HTTP_REFERER", "home"))
        except Exception as e:
            messages.error(request, f"Error al crear la salida: {e}")
            return redirect(request.META.get("HTTP_REFERER", "home"))
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})
