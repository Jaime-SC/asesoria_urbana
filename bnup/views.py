import json, re
import calendar
from .models import (
    SalidaSOLICITUD,
    IngresoSOLICITUD,
    Departamento,
    Funcionario,
    TipoRecepcion,
    TipoSolicitud,
    EgresoAU
)
from collections import defaultdict
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractWeek
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import OuterRef, Subquery, IntegerField, F
from django.db.models.functions import TruncWeek, TruncMonth
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from dateutil.relativedelta import relativedelta
from principal.models import PerfilUsuario
from django.db.models import Prefetch
from django.contrib import messages
from bnup.models import Funcionario  # asegúrate de tenerlo importado
from collections import defaultdict
from django.db.models import Count
from datetime import datetime, date
from django.urls import reverse

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
        if tipo_usuario not in ["ADMIN", "SECRETARIA"]:
            return JsonResponse(
                {"success": False, "error": "No tiene permiso para crear solicitudes."}
            )

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        tipo_solicitud_id = request.POST.get("tipo_solicitud")  # Nuevo campo
        # Obtén el valor y quita espacios
        num_memo_str = request.POST.get("num_memo", "").strip()

        # Si el tipo de recepción es 2 u 8, el número de memo se ignora (se deja como None)
        if tipo_recepcion_id in ["2", "6", "8"]:
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
            request.POST.get("correo_solicitante") if tipo_recepcion_id in ["2", "6"] else None
        )
        EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

        # ─── correo ──────────────────────────────────────────────
        if tipo_recepcion_id in ["2", "6"]:          # CORREO o CONTRIBUYENTE
            correo_solicitante = request.POST.get("correo_solicitante", "").strip()
            if not correo_solicitante:
                return JsonResponse({"success": False,
                                    "error": "Debe ingresar un correo del solicitante."})
            if not EMAIL_RE.match(correo_solicitante):
                return JsonResponse({"success": False,
                                    "error": "El correo ingresado no es válido."})
        else:
            correo_solicitante = None
        # ─────────────────────────────────────────────────────────

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
        solicitudes = IngresoSOLICITUD.objects.filter(is_active=True) \
            .select_related("tipo_recepcion", "tipo_solicitud") \
            .prefetch_related(
                Prefetch(
                    'salidas',
                    queryset=SalidaSOLICITUD.objects.filter(is_active=True),
                    to_attr='salidas_activas'
                )
            )
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

    if tipo_usuario not in ["ADMIN", "SECRETARIA", "FUNCIONARIO"]:
        return JsonResponse({"success": False, "error": "No tiene permiso para editar registros."})

    if request.method == "POST":

        # … dentro de edit_bnup_record, en la sección POST …

        if tipo_usuario == "FUNCIONARIO":
            EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

            solicitud_id = request.POST.get("solicitud_id")
            solicitud = get_object_or_404(IngresoSOLICITUD, id=solicitud_id)

            nueva_descripcion = request.POST.get("descripcion", "").strip()
            nuevo_correo     = request.POST.get("correo_solicitante", "").strip()

            campos_a_grabar = ["descripcion"]
            solicitud.descripcion = nueva_descripcion

            # sólo si el tipo de recepción exige correo ────────────────
            if solicitud.tipo_recepcion_id in (2, 6):        # 2 = CORREO, 6 = CONTRIBUYENTE
                if not nuevo_correo:
                    return JsonResponse({"success": False,
                                        "error": "Debe ingresar un correo del solicitante."})
                if not EMAIL_RE.match(nuevo_correo):
                    return JsonResponse({"success": False,
                                        "error": "El correo ingresado no es válido."})
                solicitud.correo_solicitante = nuevo_correo
                campos_a_grabar.append("correo_solicitante")

            solicitud.save(update_fields=campos_a_grabar)

            return JsonResponse({
                "success": True,
                "data": {
                    "id": solicitud.id,
                    "descripcion": solicitud.descripcion,
                    "correo_solicitante": solicitud.correo_solicitante,
                },
            })

    # … a partir de aquí continúa el flujo normal (valida todo) para ADMIN y SECRETARIA

        solicitud_id = request.POST.get("solicitud_id")
        solicitud = get_object_or_404(IngresoSOLICITUD, id=solicitud_id)

        tipo_recepcion_id = request.POST.get("tipo_recepcion")
        tipo_solicitud_id = request.POST.get("tipo_solicitud")  # Nuevo campo
        num_memo_str = request.POST.get("num_memo", "").strip()
        if tipo_recepcion_id in ["2", "6", "8"]:
            numero_memo = None
        elif tipo_solicitud_id == "10":
            numero_memo = int(num_memo_str) if num_memo_str != "" else None
        else:
            if num_memo_str == "":
                return JsonResponse({"success": False, "error": "El campo número de documento es obligatorio."})
            else:
                numero_memo = int(num_memo_str)

        EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

        correo_solicitante = request.POST.get("correo_solicitante") if tipo_recepcion_id in ["2", "6"] else None
        if tipo_recepcion_id in ["2", "6"]:
            correo_solicitante = request.POST.get("correo_solicitante", "").strip()
            if not correo_solicitante:
                return JsonResponse({"success": False,
                                    "error": "Debe ingresar un correo del solicitante."})
            if not EMAIL_RE.match(correo_solicitante):
                return JsonResponse({"success": False,
                                    "error": "El correo ingresado no es válido."})
        else:
            correo_solicitante = None
        depto_solicitante_id = request.POST.get("depto_solicitante")
        numero_ingreso = request.POST.get("numero_ingreso")
        fecha_ingreso_au_str = request.POST.get(
            "fecha_ingreso_au")  # Renombrado
        fecha_solicitud_str = request.POST.get("fecha_solicitud")
        descripcion = request.POST.get("descripcion")
        archivo_adjunto = request.FILES.get("archivo_adjunto_ingreso")

        # ————————— Manejo del archivo adjunto ————————————
        delete_flag = request.POST.get("delete_archivo") == "1"

        if delete_flag and solicitud.archivo_adjunto_ingreso:
            # el usuario pidió eliminar el archivo sin subir otro
            solicitud.archivo_adjunto_ingreso.delete(save=False)
            solicitud.archivo_adjunto_ingreso = None

        # si llega un archivo nuevo, siempre sustituye al que hubiera
        if archivo_adjunto:
            solicitud.archivo_adjunto_ingreso = archivo_adjunto
        # ————————————————————————————————————————————————


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

# views.py
@login_required
@require_http_methods(["GET", "POST"])
def edit_salida(request):
    # ───────────────────────────────────────────────────────── permisos ──
    perfil = PerfilUsuario.objects.filter(user=request.user).first()
    tipo   = perfil.tipo_usuario.nombre if perfil else None
    if tipo not in ["ADMIN", "SECRETARIA", "FUNCIONARIO", "JEFE"]:
        return JsonResponse({"success": False, "error": "Sin permiso."})

    # ────────────────────────────────────────────────────────── GET ▸ datos
    if request.method == "GET":
        salida_id = request.GET.get("salida_id")
        salida = get_object_or_404(SalidaSOLICITUD, id=salida_id, is_active=True)

        data = {
            "id":            salida.id,
            "solicitud_id":  salida.ingreso_solicitud.id,
            "numero_salida": salida.numero_salida,
            "fecha_salida":  salida.fecha_salida.strftime("%Y-%m-%d"),
            "descripcion":   salida.descripcion or "",
            "archivo_url":   salida.archivo_adjunto_salida.url      # ★ NUEVO
                            if salida.archivo_adjunto_salida else "",
            "funcionarios": [
                {"id": f.id, "nombre": f.nombre} for f in salida.funcionarios.all()
            ],
        }
        return JsonResponse({"success": True, "data": data})

    # ───────────────────────────────────────────────────────── POST ▸ save
    salida_id = request.POST.get("salida_id")
    salida = get_object_or_404(SalidaSOLICITUD, id=salida_id, is_active=True)

    # ❶ Actualiza Nº y Fecha sólo si llegan en la petición
    num = request.POST.get("numero_salida")
    if num:                         # ⇐ evita sobrescribir con None
        salida.numero_salida = num

    fecha_txt = request.POST.get("fecha_salida")
    if fecha_txt:
        salida.fecha_salida = datetime.strptime(fecha_txt, "%Y-%m-%d").date()

    # ❷ Descripción (puede ser vacía)
    salida.descripcion = request.POST.get("descripcion_salida", "").strip()

    # ❸ Archivo adjunto (opcional)
    delete_flag = request.POST.get("delete_archivo_salida") == "1"

    if delete_flag and salida.archivo_adjunto_salida:
        salida.archivo_adjunto_salida.delete(save=False)
        salida.archivo_adjunto_salida = None

    if request.FILES.get("archivo_adjunto_salida"):
        salida.archivo_adjunto_salida = request.FILES["archivo_adjunto_salida"]
        # (si sube uno nuevo, ignoramos delete_flag)

    # --------------------------------------------------------


    # ❹ Funcionarios (sólo ADMIN / SECRETARIA / JEFE)
    if tipo in ["ADMIN", "SECRETARIA", "JEFE"]:
        ids = request.POST.getlist("funcionarios_salidas")
        salida.funcionarios.set(Funcionario.objects.filter(id__in=ids))

    salida.save()

    # ─────────────────────────────────────────────── respuesta JSON final ─
    return JsonResponse({
    "success": True,
    "data": {
            "id":            salida.id,
            "solicitud_id":  salida.ingreso_solicitud.id,
            "numero_salida": salida.numero_salida,
            "fecha_salida":  salida.fecha_salida.strftime("%d/%m/%Y"),
            "descripcion":   salida.descripcion or "",
            "archivo_url":   salida.archivo_adjunto_salida.url     # ★ NUEVO
                            if salida.archivo_adjunto_salida else "",
            "funcionarios": [
                {"id": f.id, "nombre": f.nombre} for f in salida.funcionarios.all()
            ],
        }
    })



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
    if tipo_usuario not in ["ADMIN", "JEFE"]:
        messages.error(request, "No tiene permiso para ver las estadísticas.")
        return redirect("bnup_form")
    
    current_year = datetime.now().year
    current_week = datetime.now().isocalendar()[1]
    current_month = datetime.now().month

    # Entradas activas del año actual
    active_solicitudes = IngresoSOLICITUD.objects.filter(
        is_active=True, 
        fecha_ingreso_au__year=current_year
    ).exclude(tipo_solicitud__id=12)

    
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
    # Seleccionar ingresos que tengan salidas activas del año actual
    ingresos_with_salidas = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=False,
        fecha_ingreso_au__year=current_year
    ).distinct()

    for ingreso in ingresos_with_salidas:
        # Se toma la primera salida (ordenada por fecha)
        salida = ingreso.salidas.filter(is_active=True).order_by('fecha_salida').first()
        if salida:
            diff = (salida.fecha_salida - ingreso.fecha_ingreso_au).days
            mes = ingreso.fecha_ingreso_au.month  # Este valor (1,2,...,12) se usará como clave
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

    # Calcular solicitudes pendientes (sin salida) agrupadas por tipo de solicitud,
    # excluyendo aquellas con tipo_solicitud con id 12 (CONOCIMIENTO Y DISTRIBUCION)
    pendientes_por_tipo = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=True
    ).exclude(
        tipo_solicitud__id=12
    ).values("tipo_solicitud__tipo").annotate(total=Count("id"))
    pendientes_por_tipo = { item["tipo_solicitud__tipo"]: item["total"] for item in pendientes_por_tipo }

    pendientes_por_funcionario = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=True
    ).exclude(tipo_solicitud__id=12).values("funcionarios_asignados__nombre").annotate(total=Count("id"))
    pendientes_por_funcionario = { item["funcionarios_asignados__nombre"]: item["total"] for item in pendientes_por_funcionario }

    pendientes_por_solicitante = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=True
    ).exclude(tipo_solicitud__id=12).values("depto_solicitante__nombre").annotate(total=Count("id"))
    pendientes_por_solicitante = { item["depto_solicitante__nombre"]: item["total"] for item in pendientes_por_solicitante }

    # Calcular el promedio de días entre ingreso y la primera salida por solicitante
    promedio_dias_por_solicitante = {}
    ingresos_with_salidas = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=False,
        fecha_ingreso_au__year=current_year
    ).distinct()

    # Calcular el promedio de días entre ingreso y la primera salida por tipo de solicitud
    promedio_dias_por_tipo = {}
    ingresos_with_salidas = IngresoSOLICITUD.objects.filter(
        is_active=True,
        salidas__isnull=False,
        fecha_ingreso_au__year=current_year
    ).distinct()
    for ingreso in ingresos_with_salidas:
        salida = ingreso.salidas.filter(is_active=True).order_by('fecha_salida').first()
        if salida:
            diff = (salida.fecha_salida - ingreso.fecha_ingreso_au).days
            tipo = ingreso.tipo_solicitud.tipo  # Asegúrate de que 'tipo' es el campo que quieres mostrar
            promedio_dias_por_tipo.setdefault(tipo, []).append(diff)
    # Promediar los días para cada tipo
    for tipo, diffs in promedio_dias_por_tipo.items():
        promedio_dias_por_tipo[tipo] = sum(diffs) / len(diffs)

    for ingreso in ingresos_with_salidas:
        salida = ingreso.salidas.filter(is_active=True).order_by('fecha_salida').first()
        if salida:
            diff = (salida.fecha_salida - ingreso.fecha_ingreso_au).days
            solicitante = ingreso.depto_solicitante.nombre  # Se asume que este es el solicitante
            promedio_dias_por_solicitante.setdefault(solicitante, []).append(diff)

    for solicitante, diffs in promedio_dias_por_solicitante.items():
        promedio_dias_por_solicitante[solicitante] = sum(diffs) / len(diffs)

    solicitudes_por_solicitante = active_solicitudes.values("depto_solicitante__nombre").annotate(total=Count("id"))
    solicitudes_por_solicitante = { item["depto_solicitante__nombre"]: item["total"] for item in solicitudes_por_solicitante }


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
        "promedio_dias_por_funcionario": json.dumps(promedio_dias_por_funcionario, cls=DjangoJSONEncoder),
        "pendientes_por_tipo": json.dumps(pendientes_por_tipo, cls=DjangoJSONEncoder),
        "pendientes_por_funcionario": json.dumps(pendientes_por_funcionario, cls=DjangoJSONEncoder),
        "pendientes_por_solicitante": json.dumps(pendientes_por_solicitante, cls=DjangoJSONEncoder),
        "promedio_dias_por_solicitante": json.dumps(promedio_dias_por_solicitante, cls=DjangoJSONEncoder),
        "promedio_dias_por_solicitante": json.dumps(promedio_dias_por_solicitante, cls=DjangoJSONEncoder),
        "solicitudesPorSolicitante": json.dumps(solicitudes_por_solicitante, cls=DjangoJSONEncoder),
        "promedio_dias_por_tipo": json.dumps(promedio_dias_por_tipo, cls=DjangoJSONEncoder),
    }
    
    return render(request, "bnup/statistics.html", context)

def get_week_range(year, week):
    """
    Dado un año y un número de semana ISO, devuelve el lunes y viernes de esa semana,
    y el nombre del mes en español basado en el lunes.
    """
    monday = date.fromisocalendar(year, week, 1)
    friday = date.fromisocalendar(year, week, 5)
    month_name = monday.strftime('%B')
    meses_es = {
        'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo', 'April': 'Abril',
        'May': 'Mayo', 'June': 'Junio', 'July': 'Julio', 'August': 'Agosto',
        'September': 'Septiembre', 'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
    }
    month_es = meses_es.get(month_name, month_name)
    return monday, friday, month_es

@login_required
def report_view(request):
    current_year = datetime.now().year
    active_solicitudes = IngresoSOLICITUD.objects.filter(
        is_active=True, fecha_ingreso_au__year=current_year
    ).exclude(tipo_solicitud__id=12)
    total_solicitudes = active_solicitudes.count()

    total_salidas = SalidaSOLICITUD.objects.filter(
        ingreso_solicitud__in=active_solicitudes,
        is_active=True,
        fecha_salida__year=current_year
    ).count()

    tasa_respuesta = (total_salidas / total_solicitudes * 100) if total_solicitudes else 0

    solicitudes_con_salida = active_solicitudes.filter(salidas__isnull=False).distinct().count()
    porcentaje_solicitudes_con_salida = (solicitudes_con_salida / total_solicitudes * 100) if total_solicitudes else 0

    solicitudes_con_mas_de_una = active_solicitudes.annotate(num_salidas=Count('salidas')).filter(num_salidas__gt=1).count()
    porcentaje_solicitudes_con_mas_de_una = (solicitudes_con_mas_de_una / total_solicitudes * 100) if total_solicitudes else 0

    promedio_salidas = (total_salidas / total_solicitudes) if total_solicitudes else 0

    # Entradas por Mes: calcular y ordenar
    entradas_por_mes_qs = active_solicitudes.annotate(mes=ExtractMonth("fecha_ingreso_au")).values("mes").annotate(total=Count("id"))
    entradas_por_mes = {item["mes"]: item["total"] for item in entradas_por_mes_qs}
    sorted_meses = sorted(entradas_por_mes.items(), key=lambda x: x[1], reverse=True)
    # Aquí preparamos el top 3 con nombres y porcentajes
    meses_es = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    if sorted_meses:
        top3_meses_sorted = sorted_meses[:3]
        top3_total_meses = sum(cantidad for mes, cantidad in top3_meses_sorted)
        top3_porcentaje_meses = (top3_total_meses / total_solicitudes * 100) if total_solicitudes else 0
        # Preparamos una lista detallada para los 3 meses
        top3_meses_detailed = []
        for mes, cantidad in top3_meses_sorted:
            mes_nombre = meses_es.get(mes, mes)
            porcentaje = (cantidad / total_solicitudes * 100) if total_solicitudes else 0
            top3_meses_detailed.append({
                'mes': mes,
                'cantidad': cantidad,
                'mes_nombre': mes_nombre,
                'porcentaje': porcentaje,
            })
    else:
        top3_meses_sorted = []
        top3_total_meses = 0
        top3_porcentaje_meses = 0
        top3_meses_detailed = []

    # Entradas por Semana (lo que ya tienes)
    entradas_por_semana_qs = active_solicitudes.annotate(semana=ExtractWeek("fecha_ingreso_au")).values("semana").annotate(total=Count("id"))
    entradas_por_semana = {item["semana"]: item["total"] for item in entradas_por_semana_qs}
    sorted_semanas = sorted(entradas_por_semana.items(), key=lambda x: x[1], reverse=True)
    if sorted_semanas:
        top3_semanas = sorted_semanas[:3]
        top3_total_semanas = sum(cantidad for semana, cantidad in top3_semanas)
        top3_porcentaje_semanas = (top3_total_semanas / total_solicitudes * 100) if total_solicitudes else 0
        top3_weeks_descriptive = []
        for semana, cantidad in top3_semanas:
            monday, friday, month_es = get_week_range(current_year, semana)
            desc = f"Semana {semana} de {month_es} desde el <strong>Lunes {monday.strftime('%d/%m')}</strong> hasta el <strong>Viernes {friday.strftime('%d/%m')}</strong>"

            top3_weeks_descriptive.append({
                'semana': semana,
                'cantidad': cantidad,
                'descripcion': desc,
            })
    else:
        top3_total_semanas = 0
        top3_porcentaje_semanas = 0
        top3_weeks_descriptive = []

    # Solicitudes agrupadas por departamento
    solicitudes_por_depto_qs = active_solicitudes.values('depto_solicitante__nombre').annotate(total=Count('id')).order_by('-total')
    solicitudes_por_depto_list = list(solicitudes_por_depto_qs)
    top_10_departamentos = solicitudes_por_depto_list[:10]
    departamentos_adicionales = len(solicitudes_por_depto_list) - len(top_10_departamentos)

    # Solicitudes agrupadas por Funcionario Asignado
    solicitudes_por_funcionario_qs = active_solicitudes.values('funcionarios_asignados__nombre').annotate(total=Count('id')).order_by('-total')
    solicitudes_por_funcionario = list(solicitudes_por_funcionario_qs)

    # Solicitudes agrupadas por Tipo de Recepción
    solicitudes_por_tipo_recepcion_qs = active_solicitudes.values('tipo_recepcion__tipo').annotate(total=Count('id')).order_by('-total')
    solicitudes_por_tipo_recepcion = list(solicitudes_por_tipo_recepcion_qs)

    # Solicitudes agrupadas por Tipo de Solicitud
    solicitudes_por_tipo_solicitud_qs = active_solicitudes.values('tipo_solicitud__tipo').annotate(total=Count('id')).order_by('-total')
    solicitudes_por_tipo_solicitud = list(solicitudes_por_tipo_solicitud_qs)

    # Asumimos que IngresoSOLICITUD tiene una relación many-to-many llamada "funcionarios_asignados"
    # Para cada funcionario, calculamos cuántas solicitudes están asignadas.
    top_funcionarios_qs = active_solicitudes.values('funcionarios_asignados__nombre') \
                            .annotate(total=Count('id')) \
                            .order_by('-total')

    # Convertimos a lista y calculamos el porcentaje de cada uno
    top_funcionarios = []
    for item in top_funcionarios_qs:
        nombre = item['funcionarios_asignados__nombre']
        total_funcionario = item['total']
        porcentaje = (total_funcionario / total_solicitudes * 100) if total_solicitudes else 0
        top_funcionarios.append((nombre, porcentaje, total_funcionario))

    # Opcional: Limitar a los 3 o tantos que desees mostrar
    top_funcionarios = top_funcionarios[:3]

    # Definir los umbrales (puedes usar valores fijos o variables configurables)
    threshold_carga_alta = 40  # Ejemplo: 40%
    threshold_carga_significativa = 20  # Ejemplo: 20%

    # Para los 3 departamentos con mayor solicitudes:
    top_3_deptos = list(active_solicitudes.values('depto_solicitante__nombre').annotate(total=Count('id')).order_by('-total'))[:3]
    total_top3_deptos = sum(item['total'] for item in top_3_deptos)
    top3_percentage_deptos = (total_top3_deptos / total_solicitudes * 100) if total_solicitudes else 0
    rest_total_deptos = total_solicitudes - total_top3_deptos
    rest_percentage_deptos = (rest_total_deptos / total_solicitudes * 100) if total_solicitudes else 0

    # Solicitudes pendientes: aquellas sin salidas asociadas
    pendientes_qs = active_solicitudes.filter(salidas__isnull=True)

    # Agrupamos por cada funcionario asignado
    pendientes_por_funcionario = {}
    for sol in pendientes_qs:
        for funcionario in sol.funcionarios_asignados.all():
            nombre = funcionario.nombre
            if nombre not in pendientes_por_funcionario:
                pendientes_por_funcionario[nombre] = {"total": 0, "ingresos": []}
            pendientes_por_funcionario[nombre]["total"] += 1
            pendientes_por_funcionario[nombre]["ingresos"].append(sol.numero_ingreso)

    # Convertimos el diccionario en una lista (opcional: ordenada de mayor a menor número de solicitudes pendientes)
    pendientes_por_funcionario_list = [
        {"nombre": nombre, "total": data["total"], "ingresos": data["ingresos"]}
        for nombre, data in pendientes_por_funcionario.items()
    ]
    pendientes_por_funcionario_list = sorted(pendientes_por_funcionario_list, key=lambda x: x["total"], reverse=True)

    # Solicitudes pendientes: aquellas sin salidas asociadas
    pendientes_qs = active_solicitudes.filter(salidas__isnull=True)

    # Agrupar las solicitudes pendientes por departamento solicitante
    pendientes_por_depto = {}
    for sol in pendientes_qs:
        # Usamos el nombre del departamento solicitante
        depto = sol.depto_solicitante.nombre
        if depto not in pendientes_por_depto:
            pendientes_por_depto[depto] = {"total": 0, "ingresos": []}
        pendientes_por_depto[depto]["total"] += 1
        pendientes_por_depto[depto]["ingresos"].append(sol.numero_ingreso)

    # Convertir el diccionario en una lista de diccionarios ordenada (por ejemplo, de mayor a menor pendientes)
    pendientes_por_depto_list = [
        {"nombre": nombre, "total": data["total"], "ingresos": data["ingresos"]}
        for nombre, data in pendientes_por_depto.items()
    ]
    pendientes_por_depto_list = sorted(pendientes_por_depto_list, key=lambda x: x["total"], reverse=True)

    # Solicitudes pendientes por Tipo de Solicitud: aquellas sin salidas asociadas
    pendientes_tipo_qs = active_solicitudes.filter(salidas__isnull=True)

    # Agrupamos por el tipo de solicitud (usando la relación tipo_solicitud__tipo)
    pendientes_por_tipo_solicitud = {}
    for sol in pendientes_tipo_qs:
        tipo = sol.tipo_solicitud.tipo
        if tipo not in pendientes_por_tipo_solicitud:
            pendientes_por_tipo_solicitud[tipo] = {"total": 0, "ingresos": []}
        pendientes_por_tipo_solicitud[tipo]["total"] += 1
        pendientes_por_tipo_solicitud[tipo]["ingresos"].append(sol.numero_ingreso)

    # Convertimos el diccionario en una lista para poder iterar y, opcionalmente, ordenar de mayor a menor
    pendientes_por_tipo_solicitud_list = [
        {"tipo": tipo, "total": data["total"], "ingresos": data["ingresos"]}
        for tipo, data in pendientes_por_tipo_solicitud.items()
    ]
    pendientes_por_tipo_solicitud_list = sorted(pendientes_por_tipo_solicitud_list, key=lambda x: x["total"], reverse=True)

    # Solicitudes sin respuesta: aquellas sin salidas asociadas, ordenadas de manera ascendente (más antiguas primero)
    solicitudes_sin_respuesta_qs = active_solicitudes.filter(salidas__isnull=True).order_by("fecha_ingreso_au")[:5]

    # Preparamos una lista de las 5 solicitudes más antiguas sin respuesta
    solicitudes_mas_antiguas = []
    for sol in solicitudes_sin_respuesta_qs:
        tipo_solicitud = sol.tipo_solicitud.tipo
        solicitante = sol.depto_solicitante.nombre
        # Si hay más de un funcionario, los unimos en una cadena separados por comas
        funcionarios = ", ".join([f.nombre for f in sol.funcionarios_asignados.all()])
        solicitudes_mas_antiguas.append({
            "tipo_solicitud": tipo_solicitud,
            "solicitante": solicitante,
            "funcionarios": funcionarios,
            "numero_ingreso": sol.numero_ingreso,  # opcional, puedes mostrarlo si lo necesitas
            "fecha_ingreso": sol.fecha_ingreso_au,  # opcional, si quieres mostrar la fecha
        })

            # —————— SALIDAS AGRUPADAS POR CATEGORÍAS ——————
    # Obtenemos las salidas de este año asociadas a las solicitudes activas
    salidas_qs = SalidaSOLICITUD.objects.filter(
        ingreso_solicitud__in=active_solicitudes,
        is_active=True,
        fecha_salida__year=current_year
    )

    # 1) Salidas por Tipo de Solicitud
    salidas_por_tipo_solicitud_qs = salidas_qs.values(
        'ingreso_solicitud__tipo_solicitud__tipo'
    ).annotate(total=Count('id')).order_by('-total')
    salidas_por_tipo_solicitud = list(salidas_por_tipo_solicitud_qs)

    # 2) Salidas por Tipo de Recepción
    salidas_por_tipo_recepcion_qs = salidas_qs.values(
        'ingreso_solicitud__tipo_recepcion__tipo'
    ).annotate(total=Count('id')).order_by('-total')
    salidas_por_tipo_recepcion = list(salidas_por_tipo_recepcion_qs)

    # 3) Salidas por Solicitante (Departamento)
        # Por Solicitante
    salidas_por_solicitante_qs = salidas_qs.values(
        'ingreso_solicitud__depto_solicitante__nombre'
    ).annotate(total=Count('id')).order_by('-total')
    salidas_por_solicitante = list(salidas_por_solicitante_qs)

    # Top‑10 y resto
    full = salidas_por_solicitante
    top10_solicitantes = full[:10]
    resto_solicitantes = full[10:]
    total_resto = sum(item['total'] for item in resto_solicitantes)
    resto_pct = (total_resto / total_salidas * 100) if total_salidas else 0

    


    # 4) Salidas por Funcionario Asignado (recorremos m2m)
    salidas_por_funcionario = {}
    for salida in salidas_qs:
        for func in salida.ingreso_solicitud.funcionarios_asignados.all():
            nombre = func.nombre
            salidas_por_funcionario.setdefault(nombre, 0)
            salidas_por_funcionario[nombre] += 1
    salidas_por_funcionario = [
        {'nombre': n, 'total': t}
        for n, t in salidas_por_funcionario.items()
    ]
    salidas_por_funcionario.sort(key=lambda x: x['total'], reverse=True)

    # al principio de report_view, justo donde tienes el dict entradas_por_mes:
    entradas_por_mes_qs = active_solicitudes\
        .annotate(mes=ExtractMonth("fecha_ingreso_au"))\
        .values("mes")\
        .annotate(total=Count("id"))

    # construimos el dict original y además preparamos la lista ordenada:
    entradas_por_mes = {item["mes"]: item["total"] for item in entradas_por_mes_qs}
    # mapa número→nombre de mes
    meses_es = {
        1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
        5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
        9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
    }
    # lista ordenada cronológicamente
    entradas_por_mes_table = [
        {
        "mes_num": mes,
        "mes_nombre": meses_es.get(mes, str(mes)),
        "cantidad": cantidad
        }
        for mes, cantidad in sorted(entradas_por_mes.items())
    ]

    # ========================================================================
    # 8) Solicitudes por funcionario del mes actual
    # ========================================================================
    current_month = datetime.now().month
    current_month_nombre = meses_es[current_month]
    qs_mes_actual = active_solicitudes.filter(fecha_ingreso_au__month=current_month)
    total_solicitudes_mes_actual = qs_mes_actual.count()
    solicitudes_mes_actual_por_funcionario = list(
        qs_mes_actual.values('funcionarios_asignados__nombre')
                    .annotate(total=Count('id'))
                    .order_by('-total')
    )

    # —————— RANGO DEL MES ACTUAL ——————
    first_day = date(current_year, current_month, 1)
    last_day_num = calendar.monthrange(current_year, current_month)[1]
    last_day  = date(current_year, current_month, last_day_num)
    dias_es = {
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado',
        'Sunday': 'Domingo'
    }
    mes_actual_rango = f"Del {dias_es[first_day.strftime('%A')]} {first_day.strftime('%d/%m')} al {dias_es[last_day.strftime('%A')]} {last_day.strftime('%d/%m')}"
    # ========================================================================

    # ========================================================================
    # Entradas por semana en los últimos 3 meses
    # ========================================================================
    # Fecha de corte: hace 3 meses desde hoy
    fecha_corte = date.today() - relativedelta(months=3)

    qs_ultimos_3m = active_solicitudes.filter(fecha_ingreso_au__gte=fecha_corte)

    semanas_ult3m_qs = (
        qs_ultimos_3m
        .annotate(year=ExtractYear("fecha_ingreso_au"), week=ExtractWeek("fecha_ingreso_au"))
        .values("year", "week")
        .annotate(total=Count("id"))
        .order_by("year", "week")
    )

    semanas_ult3m = []
    for item in semanas_ult3m_qs:
        y, w, total = item["year"], item["week"], item["total"]
        monday, friday, month_es = get_week_range(y, w)
        desc = f"{month_es} — Lunes {monday.strftime('%d')} hasta Viernes {friday.strftime('%d')}"
        semanas_ult3m.append({
            "descripcion": desc,
            "total": total
        })
    # ========================================================================

    # —————— INGRESOS SEMANA ACTUAL POR FUNCIONARIO ——————
    # Hoy y semana ISO actual
    today = date.today()
    iso_year, iso_week, _ = today.isocalendar()
    # Rango de lunes a viernes de la semana actual
    monday, friday, month_es = get_week_range(iso_year, iso_week)
    semana_actual_desc = f"Semana {iso_week} de {month_es} (Lunes {monday.strftime('%d/%m')} - Viernes {friday.strftime('%d/%m')})"

    # Filtrar sólo las solicitudes de esta semana ISO
    qs_semana_actual = active_solicitudes.filter(
        fecha_ingreso_au__year=iso_year,
        fecha_ingreso_au__week=iso_week
    )
    # Agrupar por funcionario asignado
    sem_act_qs = qs_semana_actual.values('funcionarios_asignados__nombre')\
                     .annotate(total=Count('id'))\
                     .order_by('-total')
    solicitudes_semana_actual_por_funcionario = [
        {'nombre': item['funcionarios_asignados__nombre'], 'total': item['total']}
        for item in sem_act_qs
    ]

    # Vamos a acumular dos contadores:
    #   ingresos_by[(nombre_funcionario, tipo_solicitud)] = cantidad de ingresos
    #   salidas_by[(nombre_funcionario, tipo_solicitud)]  = cantidad de salidas asociadas
    ingresos_by = defaultdict(int)
    salidas_by  = defaultdict(int)

    # Prefetch para no golpear la BD en cada iteración
    qs_ingresos_prefetch = active_solicitudes.prefetch_related('funcionarios_asignados', 
                                                               'salidas')

    for ingreso in qs_ingresos_prefetch:
        tipo = ingreso.tipo_solicitud.tipo
        # Contamos cuántas salidas activas de este ingreso cayeron en el año actual:
        # (suponemos que SalidaSOLICITUD.fe​cha_salida__year=current_year ya está filtrado en salidas_qs)
        salidas_del_ingreso = ingreso.salidas.filter(is_active=True, 
                                                      fecha_salida__year=current_year).count()

        for funcionario in ingreso.funcionarios_asignados.all():
            nombre_func = funcionario.nombre
            ingresos_by[(nombre_func, tipo)] += 1
            salidas_by[(nombre_func, tipo)]  += salidas_del_ingreso

    # Convertimos esos dos dicts en una lista “plana”:
    # [
    #   {'funcionario': 'Ana Pérez', 'tipo': 'Oficio', 'ingresos': 12, 'salidas': 15}, …
    # ]
    lista_por_funcionario_tipo = []
    for (nombre_func, tipo), count_ing in ingresos_by.items():
        lista_por_funcionario_tipo.append({
            'funcionario': nombre_func,
            'tipo':        tipo,
            'ingresos':    count_ing,
            'salidas':     salidas_by[(nombre_func, tipo)],
        })
    # (opcionalmente ordenar por funcionario y tipo)
    lista_por_funcionario_tipo.sort(key=lambda x: (x['funcionario'], x['tipo']))
    # ———————————————————————————————————————————————————————————————————————

    # ——————————————————————————
    # Ahora agrupamos esa lista plana en una estructura por funcionario,
    # para luego iterar cómodo en la plantilla:
    agrupado_por_funcionario_tipo = {}
    for item in lista_por_funcionario_tipo:
        nombre_func = item['funcionario']
        if nombre_func not in agrupado_por_funcionario_tipo:
            agrupado_por_funcionario_tipo[nombre_func] = []
        agrupado_por_funcionario_tipo[nombre_func].append({
            'tipo':    item['tipo'],
            'ingresos': item['ingresos'],
            'salidas':  item['salidas'],
        })

    # Convertimos en lista de dicts:
    lista_agrupada = [
        {
          'funcionario': nombre,
          'tipos':       agrupado_por_funcionario_tipo[nombre]
        }
        for nombre in agrupado_por_funcionario_tipo
    ]


    context = {
        "total_solicitudes": total_solicitudes,
        "total_salidas": total_salidas,
        "tasa_respuesta": tasa_respuesta,
        "porcentaje_solicitudes_con_salida": porcentaje_solicitudes_con_salida,
        "porcentaje_solicitudes_con_mas_de_una_salida": porcentaje_solicitudes_con_mas_de_una,
        "promedio_salidas": promedio_salidas,
        # Variables para las entradas por mes y semana, etc.
        "entradas_por_mes": entradas_por_mes,
        "entradas_por_semana": entradas_por_semana,
        "top3_meses_detailed": top3_meses_detailed,
        "top3_total_meses": top3_total_meses,
        "top3_porcentaje_meses": top3_porcentaje_meses,
        "top3_weeks_descriptive": top3_weeks_descriptive,
        "top3_porcentaje_semanas": top3_porcentaje_semanas,
        "top3_total_semanas": top3_total_semanas,
        "solicitudes_por_depto": top_10_departamentos,
        "rest_departamentos": departamentos_adicionales,
        "top3_percentage": top3_percentage_deptos,
        "total_top3": total_top3_deptos,
        "rest_percentage": rest_percentage_deptos,
        "rest_total": rest_total_deptos,
        # Nuevas variables para las categorías adicionales:
        "solicitudes_con_salida": solicitudes_con_salida,
        "solicitudes_con_mas_de_una": solicitudes_con_mas_de_una,
        "solicitudes_por_funcionario": solicitudes_por_funcionario,
        "solicitudes_por_tipo_recepcion": solicitudes_por_tipo_recepcion,
        "solicitudes_por_tipo_solicitud": solicitudes_por_tipo_solicitud,
        "top_funcionarios": top_funcionarios,
        "threshold_carga_alta": threshold_carga_alta,
        "threshold_carga_significativa": threshold_carga_significativa,
        # Nueva variable para solicitudes pendientes de salida por funcionario:
        "pendientes_por_funcionario": pendientes_por_funcionario_list,
        "pendientes_por_depto": pendientes_por_depto_list,
        "pendientes_por_tipo_solicitud": pendientes_por_tipo_solicitud_list,
        "solicitudes_mas_antiguas": solicitudes_mas_antiguas,
        "salidas_por_tipo_solicitud": salidas_por_tipo_solicitud,
        "salidas_por_tipo_recepcion": salidas_por_tipo_recepcion,
        "salidas_por_solicitante": salidas_por_solicitante,
        "salidas_por_funcionario": salidas_por_funcionario,
        "salidas_por_solicitante_top10": top10_solicitantes,
        "resto_solicitantes_count": len(resto_solicitantes),
        "resto_solicitantes_total": total_resto,
        "resto_solicitantes_pct": resto_pct,
        "entradas_por_mes_table": entradas_por_mes_table,
        "current_month_nombre": current_month_nombre,
        "total_solicitudes_mes_actual": total_solicitudes_mes_actual,
        "solicitudes_mes_actual_por_funcionario": solicitudes_mes_actual_por_funcionario,
        "mes_actual_rango": mes_actual_rango,
        "semanas_ultimos_3m": semanas_ult3m,
        "semana_actual_desc": semana_actual_desc,
        "solicitudes_semana_actual_por_funcionario": solicitudes_semana_actual_por_funcionario,
        'solicitudes_por_tipo_por_funcionario': lista_por_funcionario_tipo,
        'agrupado_por_funcionario_tipo': lista_agrupada,
    }

    return render(request, "bnup/report.html", context)

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
                    "id": salida.id,   # ← aquí
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

    if tipo_usuario not in ["ADMIN", "SECRETARIA", "FUNCIONARIO", "JEFE"]:
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
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "No autenticado."})
    try:
        data = json.loads(request.body)
        ids = data.get("ids", [])
        # inactivamos y limpiamos M2M
        for salida in SalidaSOLICITUD.objects.filter(id__in=ids):
            salida.is_active = False
            salida.funcionarios.clear()
            salida.save()
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@require_POST
def add_departamento(request):
    """
    Agrega un nuevo departamento a la base de datos.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "No autenticado."})

    perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()
    tipo_usuario = perfil_usuario.tipo_usuario.nombre if perfil_usuario else None

    if tipo_usuario not in ["ADMIN", "SECRETARIA"]:
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


@login_required
def egresos_au_fragment(request):
    egresos = (
        EgresoAU.objects
        .prefetch_related('funcionarios')
        .select_related('destinatario')
        .order_by('-numero_egreso')[:100]
    )
    return render(request, 'bnup/egresos_au/egresos_au_table.html', {
        'egresos': egresos
    })

@login_required
def egresos_au_list(request):
    egresos = (
        EgresoAU.objects
        .prefetch_related('funcionarios')
        .select_related('destinatario')
        .order_by('-numero_egreso')
    )
    return render(request, 'bnup/egresos_au_list.html', {'egresos': egresos})


@login_required
@require_GET
def validate_egreso_numero(request):
    numero = request.GET.get("numero")
    exists = EgresoAU.objects.filter(numero_egreso=numero).exists() if numero else False
    return JsonResponse({"exists": exists})

@login_required
@require_http_methods(["GET", "POST"])
def egresos_au_create(request):
    if request.method == "GET":
        funcionarios = Funcionario.objects.order_by('nombre')
        departamentos = Departamento.objects.order_by('nombre')
        return render(request, "bnup/egresos_au/egresos_au_form.html", {
            "funcionarios": funcionarios,
            "departamentos": departamentos,
        })

    # POST
    numero     = request.POST.get("numero_egreso")
    fecha_str  = request.POST.get("fecha_egreso")
    descr      = request.POST.get("descripcion", "").strip()
    dest_id    = request.POST.get("destinatario")
    archivo    = request.FILES.get("archivo_adjunto")
    func_ids   = request.POST.get("funcionarios_seleccionados", "")  # ← hidden input con IDs separados por coma

    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return JsonResponse({"success": False, "error": "Fecha de egreso inválida."})

    try:
        eg = EgresoAU.objects.create(
            numero_egreso=numero,
            fecha_egreso=fecha,
            descripcion=descr,
            destinatario_id=dest_id or None,
            archivo_adjunto=archivo or None
        )

        # Asignar funcionarios si hay IDs válidos
        lista_ids = [int(fid) for fid in func_ids.split(',') if fid.strip().isdigit()]
        if lista_ids:
            eg.funcionarios.set(lista_ids)

        nombres_funcionarios = ", ".join(f.nombre for f in eg.funcionarios.all())

        data = {
            "id": eg.id,
            "numero_egreso": eg.numero_egreso,
            "fecha_egreso": eg.fecha_egreso.strftime("%Y-%m-%d"),
            "descripcion": eg.descripcion,
            "funcionarios": nombres_funcionarios,  # ← antes decía "funcionario"
            "destinatario": eg.destinatario.nombre if eg.destinatario else "",
            "archivo_url": eg.archivo_adjunto.url if eg.archivo_adjunto else ""
        }


        return JsonResponse({"success": True, "egreso": data})

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
