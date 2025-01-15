# bnup/views.py

import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Count
from django.db.models.functions import ExtractYear, ExtractMonth
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime


from principal.models import PerfilUsuario
from .models import SalidaSOLICITUD, IngresoSOLICITUD, Departamento, Funcionario, TipoRecepcion, TipoSolicitud


def bnup_form(request):
    """
    Maneja la visualización y creación de solicitudes de BNUP.
    - GET: Renderiza el formulario con datos necesarios.
    - POST: Procesa y guarda una nueva solicitud de BNUP.
    """
    if not request.user.is_authenticated:
        if request.method == "POST":
            return JsonResponse({"success": False, "error": "No autenticado."})
        else:
            return redirect("login")

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if request.method == "POST":
        if tipo_usuario not in ["ADMIN", "PRIVILEGIADO"]:
            return JsonResponse({"success": False, "error": "No tiene permiso para crear solicitudes de BNUP."})

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        tipo_solicitud_id = request.POST.get("tipo_solicitud")  # Nuevo campo
        numero_memo = request.POST.get("num_memo") if tipo_recepcion_id != "2" else None
        correo_solicitante = request.POST.get("correo_solicitante") if tipo_recepcion_id == "2" else None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        # nombre_solicitante = request.POST.get("nombre_solicitante")  # Eliminado
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso_au_str = request.POST.get("fecha_ingreso_au")  # Renombrado
        fecha_salida_solicitante_str = request.POST.get("fecha_salida_solicitante")  # Renombrado
        funcionario_asignado_id = request.POST.get("funcionario_asignado")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        # Convertir fecha_ingreso_au_str a objeto datetime.date
        try:
            fecha_ingreso_au = datetime.strptime(fecha_ingreso_au_str, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({"success": False, "error": "Fecha de ingreso inválida."})

        # Convertir fecha_salida_solicitante_str a objeto datetime.date (si se proporcionó)
        fecha_salida_solicitante = None
        if fecha_salida_solicitante_str:
            try:
                fecha_salida_solicitante = datetime.strptime(fecha_salida_solicitante_str, "%Y-%m-%d").date()
                if fecha_ingreso_au < fecha_salida_solicitante:
                    return JsonResponse({"success": False, "error": "La fecha del documento recepcionado no puede ser posterior a la fecha de ingreso."})
            except ValueError:
                return JsonResponse({"success": False, "error": "Fecha de egreso inválida."})

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            tipo_solicitud = TipoSolicitud.objects.get(id=tipo_solicitud_id)  # Obtener el tipo de solicitud
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)
            funcionario_asignado = Funcionario.objects.get(id=funcionario_asignado_id)

            ingreso_solicitud = IngresoSOLICITUD(
                tipo_recepcion=tipo_recepcion,
                tipo_solicitud=tipo_solicitud,  # Asignar el tipo de solicitud
                numero_memo=numero_memo,
                correo_solicitante=correo_solicitante,
                depto_solicitante=depto_solicitante,
                # nombre_solicitante=nombre_solicitante,  # Eliminado
                numero_ingreso=numero_ingreso,
                fecha_ingreso_au=fecha_ingreso_au,  # Asignar la fecha de ingreso
                fecha_salida_solicitante=fecha_salida_solicitante,  # Asignar la fecha de salida
                funcionario_asignado=funcionario_asignado,
                descripcion=descripcion,
                archivo_adjunto_ingreso=archivo_adjunto,
            )
            ingreso_solicitud.save()

            # Construir datos de la solicitud para devolver en la respuesta
            solicitud_data = {
                "id": ingreso_solicitud.id,
                "tipo_recepcion": ingreso_solicitud.tipo_recepcion.id,
                "tipo_recepcion_text": ingreso_solicitud.tipo_recepcion.tipo,
                "tipo_solicitud": ingreso_solicitud.tipo_solicitud.id,  # Nuevo campo
                "tipo_solicitud_text": ingreso_solicitud.tipo_solicitud.tipo,  # Texto del tipo de solicitud
                "numero_memo": ingreso_solicitud.numero_memo,
                "correo_solicitante": ingreso_solicitud.correo_solicitante,
                "depto_solicitante": ingreso_solicitud.depto_solicitante.id,
                "depto_solicitante_text": ingreso_solicitud.depto_solicitante.nombre,
                # "nombre_solicitante": ingreso_solicitud.nombre_solicitante,  # Eliminado
                "numero_ingreso": ingreso_solicitud.numero_ingreso,
                "fecha_ingreso_au": ingreso_solicitud.fecha_ingreso_au.strftime("%Y-%m-%d"),
                "fecha_salida_solicitante": ingreso_solicitud.fecha_salida_solicitante.strftime("%Y-%m-%d") if ingreso_solicitud.fecha_salida_solicitante else "",
                "funcionario_asignado": ingreso_solicitud.funcionario_asignado.id,
                "funcionario_asignado_text": ingreso_solicitud.funcionario_asignado.nombre,
                "descripcion": ingreso_solicitud.descripcion,
                "archivo_adjunto_ingreso_url": ingreso_solicitud.archivo_adjunto_ingreso.url if ingreso_solicitud.archivo_adjunto_ingreso else "",
            }

            return JsonResponse({"success": True, "solicitud": solicitud_data})

        except TipoRecepcion.DoesNotExist:
            return JsonResponse({"success": False, "error": "Tipo de recepción inválido."})
        except TipoSolicitud.DoesNotExist:
            return JsonResponse({"success": False, "error": "Tipo de solicitud inválido."})
        except Departamento.DoesNotExist:
            return JsonResponse({"success": False, "error": "Departamento solicitante inválido."})
        except Funcionario.DoesNotExist:
            return JsonResponse({"success": False, "error": "Funcionario asignado inválido."})
        except Exception as e:
            return JsonResponse({"success": False, "error": f"Error al guardar la solicitud: {e}"})

    else:
        solicitudes = IngresoSOLICITUD.objects.filter(is_active=True).select_related("tipo_recepcion", "tipo_solicitud")
        departamentos = Departamento.objects.all()
        funcionarios = Funcionario.objects.all()
        tipos_recepcion = TipoRecepcion.objects.all()
        tipos_solicitud = TipoSolicitud.objects.all()  # Obtener todos los tipos de solicitud

        context = {
            "departamentos": departamentos,
            "funcionarios": funcionarios,
            "solicitudes": solicitudes,
            "tipos_recepcion": tipos_recepcion,
            "tipos_solicitud": tipos_solicitud,  # Incluir en el contexto
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
        solicitud = get_object_or_404(IngresoSOLICITUD, id=solicitud_id)

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        tipo_solicitud_id = request.POST.get("tipo_solicitud")  # Nuevo campo
        numero_memo = request.POST.get("num_memo") if tipo_recepcion_id != "2" else None
        correo_solicitante = request.POST.get("correo_solicitante") if tipo_recepcion_id == "2" else None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        # nombre_solicitante = request.POST.get("nombre_solicitante")  # Eliminado
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso_au_str = request.POST.get("fecha_ingreso_au")  # Renombrado
        fecha_salida_solicitante_str = request.POST.get("fecha_salida_solicitante")  # Renombrado
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")
        
        # Convertir fecha_ingreso_au_str a objeto datetime.date
        try:
            fecha_ingreso_au = datetime.strptime(fecha_ingreso_au_str, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({"success": False, "error": "Fecha de ingreso inválida."})

        # Convertir fecha_salida_solicitante_str a objeto datetime.date (si se proporcionó)
        fecha_salida_solicitante = None
        if fecha_salida_solicitante_str:
            try:
                fecha_salida_solicitante = datetime.strptime(fecha_salida_solicitante_str, "%Y-%m-%d").date()
                if fecha_ingreso_au < fecha_salida_solicitante:
                    return JsonResponse({"success": False, "error": "La fecha del documento recepcionado no puede ser posterior a la fecha de ingreso."})
            except ValueError:
                return JsonResponse({"success": False, "error": "Fecha de egreso inválida."})

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            tipo_solicitud = TipoSolicitud.objects.get(id=tipo_solicitud_id)  # Obtener el tipo de solicitud
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)
            if tipo_usuario == "ADMIN":
                funcionario_asignado_id = request.POST.get("funcionario_asignado")
                funcionario_asignado = Funcionario.objects.get(id=funcionario_asignado_id)
            else:
                funcionario_asignado = solicitud.funcionario_asignado  # Mantener el funcionario asignado existente

            solicitud.tipo_recepcion = tipo_recepcion
            solicitud.tipo_solicitud = tipo_solicitud  # Asignar el tipo de solicitud
            solicitud.numero_memo = numero_memo
            solicitud.correo_solicitante = correo_solicitante
            solicitud.depto_solicitante = depto_solicitante
            # solicitud.nombre_solicitante = nombre_solicitante  # Eliminado
            solicitud.numero_ingreso = numero_ingreso
            solicitud.fecha_ingreso_au = fecha_ingreso_au
            solicitud.fecha_salida_solicitante = fecha_salida_solicitante  # Asignar la fecha de salida
            solicitud.descripcion = descripcion

            if tipo_usuario == "ADMIN":
                solicitud.funcionario_asignado = funcionario_asignado

            if archivo_adjunto:
                solicitud.archivo_adjunto_ingreso = archivo_adjunto

            solicitud.save()

            # Construir datos de la solicitud para devolver en la respuesta
            solicitud_data = {
                "id": solicitud.id,
                "tipo_recepcion": solicitud.tipo_recepcion.id,
                "tipo_recepcion_text": solicitud.tipo_recepcion.tipo,
                "tipo_solicitud": solicitud.tipo_solicitud.id,  # Nuevo campo
                "tipo_solicitud_text": solicitud.tipo_solicitud.tipo,  # Texto del tipo de solicitud
                "numero_memo": solicitud.numero_memo,
                "correo_solicitante": solicitud.correo_solicitante,
                "depto_solicitante": solicitud.depto_solicitante.id,
                "depto_solicitante_text": solicitud.depto_solicitante.nombre,
                # "nombre_solicitante": solicitud.nombre_solicitante,  # Eliminado
                "numero_ingreso": solicitud.numero_ingreso,
                "fecha_ingreso_au": solicitud.fecha_ingreso_au.strftime("%Y-%m-%d"),
                "fecha_salida_solicitante": solicitud.fecha_salida_solicitante.strftime("%Y-%m-%d") if solicitud.fecha_salida_solicitante else "",
                "funcionario_asignado": solicitud.funcionario_asignado.id,
                "funcionario_asignado_text": solicitud.funcionario_asignado.nombre,
                "descripcion": solicitud.descripcion,
                "archivo_adjunto_ingreso_url": solicitud.archivo_adjunto_ingreso.url if solicitud.archivo_adjunto_ingreso else "",
            }

            return JsonResponse({"success": True, "data": solicitud_data})
        except TipoRecepcion.DoesNotExist:
            return JsonResponse({"success": False, "error": "Tipo de recepción inválido."})
        except TipoSolicitud.DoesNotExist:
            return JsonResponse({"success": False, "error": "Tipo de solicitud inválido."})
        except Departamento.DoesNotExist:
            return JsonResponse({"success": False, "error": "Departamento solicitante inválido."})
        except Funcionario.DoesNotExist:
            return JsonResponse({"success": False, "error": "Funcionario asignado inválido."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    else:
        solicitud_id = request.GET.get("solicitud_id")
        solicitud = get_object_or_404(IngresoSOLICITUD, id=solicitud_id)

        data = {
            "id": solicitud.id,
            "tipo_recepcion": solicitud.tipo_recepcion.id,
            "tipo_recepcion_text": solicitud.tipo_recepcion.tipo,
            "tipo_solicitud": solicitud.tipo_solicitud.id,  # Nuevo campo
            "tipo_solicitud_text": solicitud.tipo_solicitud.tipo,  # Texto del tipo de solicitud
            "numero_memo": solicitud.numero_memo,
            "correo_solicitante": solicitud.correo_solicitante,
            "depto_solicitante": solicitud.depto_solicitante.id,
            "depto_solicitante_text": solicitud.depto_solicitante.nombre,
            # "nombre_solicitante": solicitud.nombre_solicitante,  # Eliminado
            "numero_ingreso": solicitud.numero_ingreso,
            "fecha_ingreso_au": solicitud.fecha_ingreso_au.strftime("%Y-%m-%d"),
            "fecha_salida_solicitante": solicitud.fecha_salida_solicitante.strftime("%Y-%m-%d") if solicitud.fecha_salida_solicitante else "",
            "funcionario_asignado": solicitud.funcionario_asignado.id,
            "funcionario_asignado_text": solicitud.funcionario_asignado.nombre,
            "descripcion": solicitud.descripcion,
            "archivo_adjunto_ingreso_url": solicitud.archivo_adjunto_ingreso.url if solicitud.archivo_adjunto_ingreso else "",
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

            IngresoSOLICITUD.objects.filter(id__in=ids).update(is_active=False)
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

    # Filtrar solo las solicitudes activas
    active_solicitudes = IngresoSOLICITUD.objects.filter(is_active=True)

    solicitudes_por_depto = active_solicitudes.values("depto_solicitante__nombre").annotate(total=Count("id"))
    solicitudes_por_funcionario = active_solicitudes.values("funcionario_asignado__nombre").annotate(total=Count("id"))
    solicitudes_por_tipo = active_solicitudes.values("tipo_recepcion__tipo").annotate(total=Count("id"))
    solicitudes_por_anio = (
        active_solicitudes.annotate(anio=ExtractYear("fecha_ingreso_au"))  # Renombrado
        .values("anio")
        .annotate(total=Count("id"))
    )
    solicitudes_por_mes = (
        active_solicitudes.annotate(mes=ExtractMonth("fecha_ingreso_au"))  # Renombrado
        .values("mes")
        .annotate(total=Count("id"))
    )

    total_solicitudes = active_solicitudes.count()

    # Contar salidas asociadas a solicitudes activas
    total_salidas = SalidaSOLICITUD.objects.filter(ingreso_solicitud__is_active=True).count()

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
        try:
            solicitud = IngresoSOLICITUD.objects.get(id=solicitud_id, is_active=True)
        except IngresoSOLICITUD.DoesNotExist:
            return JsonResponse({"success": False, "error": "La solicitud no existe o ha sido eliminada."})

        salidas = SalidaSOLICITUD.objects.filter(ingreso_solicitud=solicitud)
        salidas_data = [
            {
                "numero_salida": salida.numero_salida,
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else "",
            }
            for salida in salidas
        ]

        solicitud_data = {
            "tipo_solicitud": solicitud.tipo_solicitud.id,
            "tipo_solicitud_text": solicitud.tipo_solicitud.tipo,
            "fecha_salida_solicitante": solicitud.fecha_salida_solicitante.strftime("%Y-%m-%d") if solicitud.fecha_salida_solicitante else "",
        }

        return JsonResponse({"success": True, "salidas": salidas_data, "solicitud": solicitud_data})
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})

def create_salida(request):
    """
    Crea una nueva salida asociada a una solicitud de BNUP y devuelve una respuesta JSON.
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
        fecha_salida_str = request.POST.get("fecha_salida")
        archivo_adjunto_salida = request.FILES.get("archivo_adjunto_salida")

        try:
            solicitud = IngresoSOLICITUD.objects.get(id=solicitud_id, is_active=True)
            
            # Convertir la cadena de fecha a objeto datetime.date
            fecha_salida = datetime.strptime(fecha_salida_str, "%Y-%m-%d").date()

            salida = SalidaSOLICITUD(
                ingreso_solicitud=solicitud,
                numero_salida=numero_salida,
                fecha_salida=fecha_salida,
                archivo_adjunto_salida=archivo_adjunto_salida,
            )
            salida.save()

            # Construir datos de la salida para devolver en la respuesta
            salida_data = {
                "numero_salida": salida.numero_salida,
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else "",
            }

            return JsonResponse({"success": True, "salida": salida_data})
        except IngresoSOLICITUD.DoesNotExist:
            return JsonResponse({"success": False, "error": "La solicitud no existe o ha sido eliminada."})
        except ValueError as ve:
            # Error en la conversión de la fecha
            return JsonResponse({"success": False, "error": f"Fecha inválida: {ve}"})
        except Exception as e:
            return JsonResponse({"success": False, "error": f"Error al crear la salida: {e}"})
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})


@require_POST
def add_departamento(request):
    """
    Agrega un nuevo departamento a la base de datos.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "No autenticado."})

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if tipo_usuario not in ["ADMIN", "PRIVILEGIADO"]:
        return JsonResponse({"success": False, "error": "No tiene permiso para agregar departamentos."})

    try:
        data = json.loads(request.body)
        nombre = data.get("nombre", "").strip()
        if not nombre:
            return JsonResponse({"success": False, "error": "Nombre inválido."})

        # Verificar si el departamento ya existe
        if Departamento.objects.filter(nombre__iexact=nombre).exists():
            return JsonResponse({"success": False, "error": "El departamento ya existe."})

        # Crear el nuevo departamento
        departamento = Departamento(nombre=nombre)
        departamento.save()

        return JsonResponse({"success": True, "departamento": {"id": departamento.id, "nombre": departamento.nombre}})
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Datos inválidos."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
