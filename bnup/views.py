import json
from .models import (
    SalidaSOLICITUD,
    IngresoSOLICITUD,
    Departamento,
    Funcionario,
    TipoRecepcion,
    TipoSolicitud,
)
from collections import defaultdict
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractWeek
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import OuterRef, Subquery, IntegerField, F
from django.db.models.functions import TruncWeek, TruncMonth
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from principal.models import PerfilUsuario
from django.contrib import messages
from bnup.models import Funcionario  # asegúrate de tenerlo importado
from django.db.models import Count
from datetime import datetime


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
            return JsonResponse(
                {"success": False, "error": "No tiene permiso para crear solicitudes."}
            )

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        tipo_solicitud_id = request.POST.get("tipo_solicitud")  # Nuevo campo
        # Obtén el valor y quita espacios
        num_memo_str = request.POST.get("num_memo", "").strip()

        # Si el tipo de recepción es 2 u 8, el número de memo se ignora (se deja como None)
        if tipo_recepcion_id in ["2", "8"]:
            numero_memo = None
        # Si el tipo de solicitud es 10, el número de documento es opcional:
        elif tipo_solicitud_id == "10":
            # Si se ingresó un valor, lo convierte a entero; si no, se deja como None
            numero_memo = int(num_memo_str) if num_memo_str != "" else None
        # Para los demás casos, el campo es obligatorio
        else:
            if num_memo_str == "":
                return JsonResponse({"success": False, "error": "El campo número de documento es obligatorio."})
            else:
                numero_memo = int(num_memo_str)


        correo_solicitante = (
            request.POST.get(
                "correo_solicitante") if tipo_recepcion_id == "2" else None
        )
        depto_solicitante_id = request.POST.get("depto_solicitante")
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso_au_str = request.POST.get(
            "fecha_ingreso_au")  # Renombrado
        fecha_solicitud_str = request.POST.get("fecha_solicitud")  # Renombrado
        funcionarios_asignados_ids = request.POST.getlist(
            "funcionarios_asignados")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        # Validar que al menos un funcionario está asignado
        if not funcionarios_asignados_ids:
            return JsonResponse(
                {"success": False, "error": "Debe asignar al menos un funcionario."}
            )

        # Validar duplicidad de funcionarios
        if len(funcionarios_asignados_ids) != len(set(funcionarios_asignados_ids)):
            return JsonResponse(
                {
                    "success": False,
                    "error": "No puede asignar el mismo funcionario más de una vez.",
                }
            )

        # Convertir fechas
        try:
            fecha_ingreso_au = datetime.strptime(
                fecha_ingreso_au_str, "%Y-%m-%d"
            ).date()
        except ValueError:
            return JsonResponse(
                {"success": False, "error": "Fecha de ingreso inválida."}
            )

        fecha_solicitud = None
        if fecha_solicitud_str:
            try:
                fecha_solicitud = datetime.strptime(
                    fecha_solicitud_str, "%Y-%m-%d").date()
                if fecha_ingreso_au < fecha_solicitud:
                    return JsonResponse({"success": False, "error": "La fecha del documento recepcionado no puede ser posterior a la fecha de ingreso."})
            except ValueError:
                return JsonResponse({"success": False, "error": "Fecha de solicitud inválida."})

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            tipo_solicitud = TipoSolicitud.objects.get(
                id=tipo_solicitud_id
            )  # Obtener el tipo de solicitud
            depto_solicitante = Departamento.objects.get(
                id=depto_solicitante_id)
            funcionarios_asignados = Funcionario.objects.filter(
                id__in=funcionarios_asignados_ids
            )
            if not funcionarios_asignados.exists():
                return JsonResponse(
                    {"success": False, "error": "Funcionarios asignados inválidos."}
                )

            ingreso_solicitud = IngresoSOLICITUD(
                tipo_recepcion=tipo_recepcion,
                tipo_solicitud=tipo_solicitud,  # Asignar el tipo de solicitud
                numero_memo=numero_memo,
                correo_solicitante=correo_solicitante,
                depto_solicitante=depto_solicitante,
                numero_ingreso=numero_ingreso,
                fecha_ingreso_au=fecha_ingreso_au,  # Asignar la fecha de ingreso
                fecha_solicitud=fecha_solicitud,  # Asignar la fecha de salida
                descripcion=descripcion,
                archivo_adjunto_ingreso=archivo_adjunto,
            )
            ingreso_solicitud.save()

            # Asignar múltiples funcionarios
            ingreso_solicitud.funcionarios_asignados.set(
                funcionarios_asignados)

            # Construir datos de la solicitud para devolver en la respuesta
            solicitud_data = {
                "id": ingreso_solicitud.id,
                "tipo_recepcion": ingreso_solicitud.tipo_recepcion.id,
                "tipo_recepcion_text": ingreso_solicitud.tipo_recepcion.tipo,
                "tipo_solicitud": ingreso_solicitud.tipo_solicitud.id,
                "tipo_solicitud_text": ingreso_solicitud.tipo_solicitud.tipo,
                "numero_memo": ingreso_solicitud.numero_memo,
                "correo_solicitante": ingreso_solicitud.correo_solicitante,
                "depto_solicitante": ingreso_solicitud.depto_solicitante.id,
                "depto_solicitante_text": ingreso_solicitud.depto_solicitante.nombre,
                "numero_ingreso": ingreso_solicitud.numero_ingreso,
                "fecha_ingreso_au": ingreso_solicitud.fecha_ingreso_au.strftime(
                    "%Y-%m-%d"
                ),
                "fecha_solicitud": ingreso_solicitud.fecha_solicitud.strftime("%Y-%m-%d") if ingreso_solicitud.fecha_solicitud else "",
                "funcionarios_asignados": [
                    {"id": funcionario.id, "nombre": funcionario.nombre}
                    for funcionario in ingreso_solicitud.funcionarios_asignados.all()
                ],
                "descripcion": ingreso_solicitud.descripcion,
                "archivo_adjunto_ingreso_url": (
                    ingreso_solicitud.archivo_adjunto_ingreso.url
                    if ingreso_solicitud.archivo_adjunto_ingreso
                    else ""
                ),
            }

            return JsonResponse({"success": True, "solicitud": solicitud_data})

        except TipoRecepcion.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Tipo de recepción inválido."}
            )
        except TipoSolicitud.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Tipo de solicitud inválido."}
            )
        except Departamento.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Departamento solicitante inválido."}
            )
        except Funcionario.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Funcionario asignado inválido."}
            )
        except Exception as e:
            return JsonResponse(
                {"success": False, "error": f"Error al guardar la solicitud: {e}"}
            )

    else:
        solicitudes = IngresoSOLICITUD.objects.filter(is_active=True).select_related("tipo_recepcion", "tipo_solicitud")
        departamentos = Departamento.objects.all().order_by('nombre')
        funcionarios = Funcionario.objects.all().order_by('nombre')
        tipos_recepcion = TipoRecepcion.objects.all().order_by('tipo')
        tipos_solicitud = TipoSolicitud.objects.all().order_by('tipo')
        context = {
            "departamentos": departamentos,
            "funcionarios": funcionarios,
            "solicitudes": solicitudes,
            "tipos_recepcion": tipos_recepcion,
            "tipos_solicitud": tipos_solicitud,  # Incluir en el contexto
            "tipo_usuario": tipo_usuario,
            "total_funcionarios": funcionarios.count(),  # Añadido
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
        num_memo_str = request.POST.get("num_memo", "").strip()
        if tipo_recepcion_id in ["2", "8"]:
            numero_memo = None
        elif tipo_solicitud_id == "10":
            numero_memo = int(num_memo_str) if num_memo_str != "" else None
        else:
            if num_memo_str == "":
                return JsonResponse({"success": False, "error": "El campo número de documento es obligatorio."})
            else:
                numero_memo = int(num_memo_str)

        correo_solicitante = request.POST.get(
            "correo_solicitante") if tipo_recepcion_id == "2" else None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso_au_str = request.POST.get(
            "fecha_ingreso_au")  # Renombrado
        fecha_solicitud_str = request.POST.get("fecha_solicitud")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        # Convertir fecha_ingreso_au_str a objeto datetime.date
        try:
            fecha_ingreso_au = datetime.strptime(
                fecha_ingreso_au_str, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({"success": False, "error": "Fecha de ingreso inválida."})

        # Convertir fecha de solicitud
        fecha_solicitud = None
        if fecha_solicitud_str:
            try:
                fecha_solicitud = datetime.strptime(
                    fecha_solicitud_str, "%Y-%m-%d").date()
                # Si la fecha de solicitud es mayor (posterior) que la de ingreso, se lanza error
                if fecha_ingreso_au < fecha_solicitud:
                    return JsonResponse({
                        "success": False,
                        "error": "La fecha de solicitud no puede ser posterior a la fecha de ingreso."
                    })
            except ValueError:
                return JsonResponse({"success": False, "error": "Fecha de solicitud inválida."})
        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            tipo_solicitud = TipoSolicitud.objects.get(
                id=tipo_solicitud_id)  # Obtener el tipo de solicitud
            depto_solicitante = Departamento.objects.get(
                id=depto_solicitante_id)

            if tipo_usuario == "ADMIN":
                funcionarios_asignados_ids = request.POST.getlist(
                    "funcionarios_asignados")

                # Validar que al menos un funcionario está asignado
                if not funcionarios_asignados_ids:
                    return JsonResponse({"success": False, "error": "Debe asignar al menos un funcionario."})

                # Validar duplicidad de funcionarios
                if len(funcionarios_asignados_ids) != len(set(funcionarios_asignados_ids)):
                    return JsonResponse({"success": False, "error": "No puede asignar el mismo funcionario más de una vez."})

                # Obtener los funcionarios asignados
                funcionarios_asignados = Funcionario.objects.filter(
                    id__in=funcionarios_asignados_ids)
                if not funcionarios_asignados.exists():
                    return JsonResponse({"success": False, "error": "Funcionarios asignados inválidos."})
            else:
                # Mantener los funcionarios existentes si el usuario no es ADMIN
                funcionarios_asignados = solicitud.funcionarios_asignados.all()

            solicitud.tipo_recepcion = tipo_recepcion
            solicitud.tipo_solicitud = tipo_solicitud  # Asignar el tipo de solicitud
            solicitud.numero_memo = numero_memo
            solicitud.correo_solicitante = correo_solicitante
            solicitud.depto_solicitante = depto_solicitante
            solicitud.numero_ingreso = numero_ingreso
            solicitud.fecha_ingreso_au = fecha_ingreso_au
            solicitud.fecha_solicitud = fecha_solicitud
            solicitud.descripcion = descripcion

            if tipo_usuario == "ADMIN":
                solicitud.funcionarios_asignados.set(funcionarios_asignados)
            # Si otros tipos de usuarios pueden editar funcionarios, añade lógica aquí.

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
                "numero_ingreso": solicitud.numero_ingreso,
                "fecha_ingreso_au": solicitud.fecha_ingreso_au.strftime("%Y-%m-%d"),
                "fecha_solicitud": solicitud.fecha_solicitud.strftime("%Y-%m-%d") if solicitud.fecha_solicitud else "",
                "funcionarios_asignados": [
                    {"id": funcionario.id, "nombre": funcionario.nombre}
                    for funcionario in solicitud.funcionarios_asignados.all()
                ],
                "descripcion": solicitud.descripcion,
                "archivo_adjunto_ingreso_url": solicitud.archivo_adjunto_ingreso.url if solicitud.archivo_adjunto_ingreso else "",
                "salidas": [
                    {"id": salida.id, "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else ""}
                    for salida in solicitud.salidas.all()
                ],
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
            "numero_ingreso": solicitud.numero_ingreso,
            "fecha_ingreso_au": solicitud.fecha_ingreso_au.strftime("%Y-%m-%d"),
            "fecha_solicitud": solicitud.fecha_solicitud.strftime("%Y-%m-%d") if solicitud.fecha_solicitud else "",
            "funcionarios_asignados": [
                {"id": f.id, "nombre": f.nombre} for f in solicitud.funcionarios_asignados.all()
            ],
            "descripcion": solicitud.descripcion,
            "archivo_adjunto_ingreso_url": solicitud.archivo_adjunto_ingreso.url if solicitud.archivo_adjunto_ingreso else "",
            "salidas": [
                {"id": salida.id, "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else ""}
                for salida in solicitud.salidas.all()
            ],
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

        perfil_usuario = PerfilUsuario.objects.filter(
            user=request.user).first()
        tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

        if tipo_usuario != "ADMIN":
            return JsonResponse(
                {"success": False, "error": "No tiene permiso para eliminar registros."}
            )

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
    Solo se consideran datos del año actual.
    Además, se calculan datos por semana y mes para entradas y salidas, 
    así como por funcionario, para poder filtrar en JavaScript los gráficos de semana.
    """
    if not request.user.is_authenticated:
        return redirect("login")
    
    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None
    if tipo_usuario not in ["ADMIN", "PRIVILEGIADO", "VISUALIZADOR"]:
        messages.error(request, "No tiene permiso para ver las estadísticas.")
        return redirect("bnup_form")
    
    current_year = datetime.now().year
    current_week = datetime.now().isocalendar()[1]
    current_month = datetime.now().month

    # Entradas activas del año actual
    active_solicitudes = IngresoSOLICITUD.objects.filter(is_active=True, fecha_ingreso_au__year=current_year)
    
    # Solicitudes por Solicitante
    solicitudes_por_depto = active_solicitudes.values("depto_solicitante__nombre").annotate(total=Count("id"))
    
    # Solicitudes por Funcionario
    solicitudes_por_funcionario = active_solicitudes.values("funcionarios_asignados__nombre").annotate(total=Count("id"))
    
    # Por Tipo de Recepción
    solicitudes_por_tipo_recepcion = active_solicitudes.values("tipo_recepcion__tipo").annotate(total=Count("id"))
    
    # Por Tipo de Solicitud
    solicitudes_por_tipo_solicitud = active_solicitudes.values("tipo_solicitud__tipo").annotate(total=Count("id"))
    
    # Entradas por Mes y Semana (del año actual)
    solicitudes_por_mes = active_solicitudes.annotate(mes=ExtractMonth("fecha_ingreso_au")).values("mes").annotate(total=Count("id"))
    entradas_por_mes = {str(item["mes"]): item["total"] for item in solicitudes_por_mes}
    solicitudes_por_semana = active_solicitudes.annotate(semana=ExtractWeek("fecha_ingreso_au")).values("semana").annotate(total=Count("id"))
    entradas_por_semana = {str(item["semana"]): item["total"] for item in solicitudes_por_semana}
    
    # Salidas activas del año actual
    salidas_activas = SalidaSOLICITUD.objects.filter(
        ingreso_solicitud__is_active=True,
        fecha_salida__year=current_year
    ).prefetch_related("funcionarios")
    
    # Salidas por Semana (global)
    salidas_por_semana = defaultdict(int)
    for salida in salidas_activas:
        semana = salida.fecha_salida.isocalendar()[1]
        salidas_por_semana[str(semana)] += 1
    
    # Salidas Totales por Mes
    salidas_totales_mes = defaultdict(int)
    for salida in salidas_activas:
        mes = salida.fecha_salida.month
        salidas_totales_mes[str(mes)] += 1
    
    # Salidas por Funcionario (global)
    salidas_por_funcionario = defaultdict(int)
    for salida in salidas_activas:
        for funcionario in salida.funcionarios.all():
            salidas_por_funcionario[funcionario.nombre] += 1
    
    total_solicitudes = active_solicitudes.count()
    total_salidas = salidas_activas.count()
    
    # Salidas por Funcionario - Semana Actual
    salidas_semana_actual = defaultdict(int)
    for salida in salidas_activas:
        if salida.fecha_salida.isocalendar()[1] == current_week:
            for funcionario in salida.funcionarios.all():
                salidas_semana_actual[funcionario.nombre] += 1
    
    # Salidas por Funcionario - Mes Actual
    salidas_mes_actual = defaultdict(int)
    for salida in salidas_activas:
        if salida.fecha_salida.month == current_month:
            for funcionario in salida.funcionarios.all():
                salidas_mes_actual[funcionario.nombre] += 1
    
    # Entradas por Funcionario - Semana y Mes Actual
    entradas_semana_actual = defaultdict(int)
    entradas_mes_actual = defaultdict(int)
    for ingreso in active_solicitudes.prefetch_related("funcionarios_asignados"):
        semana = ingreso.fecha_ingreso_au.isocalendar()[1]
        mes = ingreso.fecha_ingreso_au.month
        for funcionario in ingreso.funcionarios_asignados.all():
            if semana == current_week:
                entradas_semana_actual[funcionario.nombre] += 1
            if mes == current_month:
                entradas_mes_actual[funcionario.nombre] += 1

    # Calcular el promedio de días entre ingreso y la primera salida (por mes)
    promedio_dias_por_mes = {}
    # Seleccionar ingresos que tengan salidas activas
    ingresos_with_salidas = IngresoSOLICITUD.objects.filter(is_active=True, salidas__isnull=False).distinct()
    for ingreso in ingresos_with_salidas:
        # Se toma la primera salida (ordenada por fecha)
        salida = ingreso.salidas.filter(is_active=True).order_by('fecha_salida').first()
        if salida:
            diff = (salida.fecha_salida - ingreso.fecha_ingreso_au).days
            mes = ingreso.fecha_ingreso_au.month  # Puedes usar el número de mes o transformarlo a nombre
            promedio_dias_por_mes.setdefault(mes, []).append(diff)
    # Calcular el promedio para cada mes
    for mes, diffs in promedio_dias_por_mes.items():
        promedio_dias_por_mes[mes] = sum(diffs) / len(diffs)

    # Calcular el promedio de días entre ingreso y la primera salida por funcionario
    promedio_dias_por_funcionario = {}
    ingresos_with_salidas = IngresoSOLICITUD.objects.filter(is_active=True, salidas__isnull=False).distinct()
    for ingreso in ingresos_with_salidas:
        # Tomar la primera salida activa, ordenada por fecha
        salida = ingreso.salidas.filter(is_active=True).order_by('fecha_salida').first()
        if salida:
            diff = (salida.fecha_salida - ingreso.fecha_ingreso_au).days
            for funcionario in ingreso.funcionarios_asignados.all():
                promedio_dias_por_funcionario.setdefault(funcionario.nombre, []).append(diff)
    # Promediar los días para cada funcionario
    for funcionario, diffs in promedio_dias_por_funcionario.items():
        promedio_dias_por_funcionario[funcionario] = sum(diffs) / len(diffs)

    context = {
        "solicitudes_por_depto": json.dumps({item["depto_solicitante__nombre"]: item["total"] for item in solicitudes_por_depto}, cls=DjangoJSONEncoder),
        "solicitudes_por_funcionario": json.dumps({item["funcionarios_asignados__nombre"]: item["total"] for item in solicitudes_por_funcionario}, cls=DjangoJSONEncoder),
        "solicitudes_por_tipo_recepcion": json.dumps({item["tipo_recepcion__tipo"]: item["total"] for item in solicitudes_por_tipo_recepcion}, cls=DjangoJSONEncoder),
        "solicitudes_por_tipo_solicitud": json.dumps({item["tipo_solicitud__tipo"]: item["total"] for item in solicitudes_por_tipo_solicitud}, cls=DjangoJSONEncoder),
        "entradas_por_mes": json.dumps(entradas_por_mes, cls=DjangoJSONEncoder),
        "entradas_por_semana": json.dumps(entradas_por_semana, cls=DjangoJSONEncoder),
        "salidas_por_mes": json.dumps(dict(entradas_por_mes), cls=DjangoJSONEncoder),  # Ajusta si deseas otras etiquetas
        "salidas_por_semana": json.dumps(dict(salidas_por_semana), cls=DjangoJSONEncoder),
        "salidas_por_funcionario": json.dumps(dict(salidas_por_funcionario), cls=DjangoJSONEncoder),
        "total_solicitudes": total_solicitudes,
        "total_salidas": total_salidas,
        "salidas_semana_actual": json.dumps(dict(salidas_semana_actual), cls=DjangoJSONEncoder),
        "salidas_mes_actual": json.dumps(dict(salidas_mes_actual), cls=DjangoJSONEncoder),
        "salidas_totales_mes": json.dumps(dict(salidas_totales_mes), cls=DjangoJSONEncoder),
        "entradas_semana_actual": json.dumps(dict(entradas_semana_actual), cls=DjangoJSONEncoder),
        "entradas_mes_actual": json.dumps(dict(entradas_mes_actual), cls=DjangoJSONEncoder),
        "promedio_dias_por_mes": json.dumps(promedio_dias_por_mes, cls=DjangoJSONEncoder),
        "promedio_dias_por_mes": json.dumps(promedio_dias_por_mes, cls=DjangoJSONEncoder),
        "promedio_dias_por_funcionario": json.dumps(promedio_dias_por_funcionario, cls=DjangoJSONEncoder),
    }
    
    return render(request, "bnup/statistics.html", context)

@login_required
def get_salidas(request, solicitud_id):
    if request.method == "GET":
        try:
            solicitud = IngresoSOLICITUD.objects.get(id=solicitud_id, is_active=True)
        except IngresoSOLICITUD.DoesNotExist:
            return JsonResponse({"success": False, "error": "La solicitud no existe o ha sido eliminada."})

        try:
            salidas = SalidaSOLICITUD.objects.filter(ingreso_solicitud=solicitud, is_active=True)
            salidas_data = []
            for salida in salidas:
                try:
                    archivo_url = salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else ""
                except Exception:
                    archivo_url = ""
                salidas_data.append({
                    "numero_salida": salida.numero_salida,
                    "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y") if salida.fecha_salida else "",
                    "archivo_url": archivo_url,
                    "descripcion": salida.descripcion,
                    "funcionarios": [{"id": f.id, "nombre": f.nombre} for f in salida.funcionarios.all()],
                })

            solicitud_data = {
                "tipo_solicitud": solicitud.tipo_solicitud.id,
                "tipo_solicitud_text": solicitud.tipo_solicitud.tipo,
                "fecha_solicitud": solicitud.fecha_solicitud.strftime("%Y-%m-%d") if solicitud.fecha_solicitud else ""
            }

            return JsonResponse({"success": True, "salidas": salidas_data, "solicitud": solicitud_data})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
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
        # Nuevo campo: descripción (opcional)
        descripcion = request.POST.get("descripcion_salida", "").strip()

        # Nuevo campo: funcionarios asignados a la salida (lista de IDs)
        funcionarios_ids = request.POST.getlist("funcionarios_salidas")

        try:
            solicitud = IngresoSOLICITUD.objects.get(
                id=solicitud_id, is_active=True
            )

            fecha_salida = datetime.strptime(fecha_salida_str, "%Y-%m-%d").date()

            salida = SalidaSOLICITUD(
                ingreso_solicitud=solicitud,
                numero_salida=numero_salida,
                fecha_salida=fecha_salida,
                archivo_adjunto_salida=archivo_adjunto_salida,
                descripcion=descripcion,
            )
            salida.save()

            # Asignar funcionarios (si se han enviado)
            if funcionarios_ids:
                funcionarios = Funcionario.objects.filter(id__in=funcionarios_ids)
                salida.funcionarios.set(funcionarios)


            # Construir datos de la salida para devolver en la respuesta
            salida_data = {
                "numero_salida": salida.numero_salida,
                "fecha_salida": salida.fecha_salida.strftime("%d/%m/%Y"),
                "archivo_url": salida.archivo_adjunto_salida.url if salida.archivo_adjunto_salida else "",
                "descripcion": salida.descripcion,
                "funcionarios": [{"id": f.id, "nombre": f.nombre} for f in salida.funcionarios.all()],
            }

            return JsonResponse({"success": True, "salida": salida_data})
        except IngresoSOLICITUD.DoesNotExist:
            return JsonResponse({"success": False, "error": "La solicitud no existe o ha sido eliminada."})
        except ValueError as ve:
            return JsonResponse({"success": False, "error": f"Fecha inválida: {ve}"})
        except Exception as e:
            return JsonResponse({"success": False, "error": f"Error al crear la salida: {e}"})
    else:
        return JsonResponse({"success": False, "error": "Método no permitido."})

@require_POST
def delete_salidas(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "error": "No autenticado."})
        try:
            data = json.loads(request.body)
            ids = data.get("ids", [])
            SalidaSOLICITUD.objects.filter(id__in=ids).update(is_active=False)
            return JsonResponse({"success": True})
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Datos inválidos."})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
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
        return JsonResponse(
            {"success": False, "error": "No tiene permiso para agregar departamentos."}
        )

    try:
        data = json.loads(request.body)
        nombre = data.get("nombre", "").strip()
        if not nombre:
            return JsonResponse({"success": False, "error": "Nombre inválido."})

        # Verificar si el departamento ya existe
        if Departamento.objects.filter(nombre__iexact=nombre).exists():
            return JsonResponse(
                {"success": False, "error": "El solicitante ya existe."}
            )

        # Crear el nuevo departamento
        departamento = Departamento(nombre=nombre)
        departamento.save()

        return JsonResponse(
            {
                "success": True,
                "departamento": {"id": departamento.id, "nombre": departamento.nombre},
            }
        )
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Datos inválidos."})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
