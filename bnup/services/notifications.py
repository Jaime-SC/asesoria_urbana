from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from bnup.services.fecha_utils import add_business_days_cl
from datetime import timedelta
import holidays

# Correos fijos
# SECRETARIA_EMAIL   = "jaimeqsanchezc@gmail.com"
# COORDINADORA_EMAIL = "jaimeqsanchezc@gmail.com"

SECRETARIA_EMAIL   = "dpalacios@munivalpo.cl"
COORDINADORA_EMAIL = "joanna.bastias@munivalpo.cl"


def _uniq(seq):
    seen = set()
    out = []
    for e in seq:
        if e and e not in seen:
            out.append(e)
            seen.add(e)
    return out

def recipients_for_ingreso(ingreso, include_solicitante=False):
    emails = [
        f.user.email
        for f in ingreso.funcionarios_asignados.select_related('user').all()
        if getattr(f, 'user', None) and getattr(f.user, 'email', None)
    ]
    if include_solicitante and ingreso.correo_solicitante:
        emails.append(ingreso.correo_solicitante)
    return _uniq(emails)

def subject_ingreso(ingreso):
    return f"[SIE] - [{ingreso.tipo_solicitud.tipo}] - Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso(ingreso, absolute_url=None):
    # calcula fecha límite: 15 días hábiles posteriores a fecha_ingreso_au
    fecha_responder_hasta = None
    if ingreso.fecha_ingreso_au:
        try:
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, 14)
        except Exception:
            # si algo falla, deja None o usa fallback sin feriados
            # from bnup.services.fecha_utils import add_business_days_no_holidays
            # fecha_responder_hasta = add_business_days_no_holidays(ingreso.fecha_ingreso_au, 15)
            pass

    return {
        "numero_ingreso": ingreso.numero_ingreso,
        "tipo_recepcion": ingreso.tipo_recepcion.tipo,
        "tipo_solicitud": ingreso.tipo_solicitud.tipo,
        "depto_solicitante": ingreso.depto_solicitante.nombre,
        "fecha_ingreso": ingreso.fecha_ingreso_au,
        "fecha_documento": ingreso.fecha_solicitud,
        "descripcion": ingreso.descripcion or "",
        "absolute_url": absolute_url or "",
        "fecha_responder_hasta": fecha_responder_hasta,
    }

def notify_ingreso_created(ingreso, *, absolute_url=None, bcc=None, attach_file=False, include_solicitante=False):
    """
    Envía correo HTML+texto cuando se crea un Ingreso.
    - include_solicitante: si True, copia al solicitante.
    - attach_file: False por defecto (no adjuntar para incentivar uso del sistema).
    """
    to_list = recipients_for_ingreso(ingreso, include_solicitante=include_solicitante)
    if not to_list:
        return 0

    # Evita duplicar la secretaria si por alguna razón ya está en TO
    cc_list = [SECRETARIA_EMAIL] if SECRETARIA_EMAIL and SECRETARIA_EMAIL not in to_list else []

    ctx = context_ingreso(ingreso, absolute_url=absolute_url)
    subject = subject_ingreso(ingreso)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER)

    text_body = render_to_string("bnup/emails/ingreso_created.txt", ctx)
    html_body = render_to_string("bnup/emails/ingreso_created.html", ctx)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=to_list,
        cc=cc_list,          # ← COPIA a la secretaria
        bcc=bcc or [],
    )
    msg.attach_alternative(html_body, "text/html")

    # ─────────────────────────────────────────────────────────────
    # Adjuntar archivo (desactivado por defecto)
    # if attach_file and ingreso.archivo_adjunto_ingreso:
    #     try:
    #         msg.attach_file(ingreso.archivo_adjunto_ingreso.path)
    #     except Exception:
    #         pass
    # ─────────────────────────────────────────────────────────────

    return msg.send(fail_silently=False)


def subject_ingreso_updated(ingreso):
    return f"[SIE] - ACTUALIZADO - Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso_updated(ingreso, *, absolute_url=None, added=None, removed=None, field_changes=None):
    """
    Contexto para email de actualización.
    - added: lista de dicts [{"id":..,"nombre":..,"email":..}, ...] de nuevos funcionarios
    - removed: lista de dicts [{"id":..,"nombre":..,"email":..}, ...] de funcionarios que ya no están
    - field_changes: lista de tuplas (label, old, new) para mostrar cambios relevantes
    """
    fecha_responder_hasta = None
    if ingreso.fecha_ingreso_au:
        try:
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, 14)
        except Exception:
            pass

    return {
        "numero_ingreso": ingreso.numero_ingreso,
        "tipo_recepcion": ingreso.tipo_recepcion.tipo if ingreso.tipo_recepcion else "",
        "tipo_solicitud": ingreso.tipo_solicitud.tipo if ingreso.tipo_solicitud else "",
        "depto_solicitante": ingreso.depto_solicitante.nombre if ingreso.depto_solicitante else "",
        "fecha_ingreso": ingreso.fecha_ingreso_au,
        "fecha_documento": ingreso.fecha_solicitud,
        "descripcion": ingreso.descripcion or "",
        "absolute_url": absolute_url or "",
        "fecha_responder_hasta": fecha_responder_hasta,
        "funcionarios_added": added or [],
        "funcionarios_removed": removed or [],
        "field_changes": field_changes or [],
    }

def notify_ingreso_updated(ingreso, *, absolute_url=None, added=None, removed=None, field_changes=None, bcc=None):
    """
    Notifica por correo que el Ingreso fue ACTUALIZADO.
    Envia a los funcionarios actuales; CC a secretaria; sin adjuntos.
    """
    # destinatarios: funcionarios vigentes
    to_list = [
        f.user.email
        for f in ingreso.funcionarios_asignados.select_related('user').all()
        if getattr(f, 'user', None) and getattr(f.user, 'email', None)
    ]
    to_list = list(dict.fromkeys([e for e in to_list if e]))  # uniq, conserva orden

    if not to_list:
        return 0

    cc_list = []
    if SECRETARIA_EMAIL and SECRETARIA_EMAIL not in to_list:
        cc_list.append(SECRETARIA_EMAIL)

    ctx = context_ingreso_updated(
        ingreso,
        absolute_url=absolute_url,
        added=added,
        removed=removed,
        field_changes=field_changes,
    )

    subject = subject_ingreso_updated(ingreso)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER)

    text_body = render_to_string("bnup/emails/ingreso_updated.txt", ctx)
    html_body = render_to_string("bnup/emails/ingreso_updated.html", ctx)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=to_list,
        cc=cc_list,
        bcc=bcc or [],
    )
    msg.attach_alternative(html_body, "text/html")
    return msg.send(fail_silently=False)

# ─────────────────────────────────────────────────────────────────────────────
# AVISO: Quedan 5 días hábiles
# ─────────────────────────────────────────────────────────────────────────────

def subject_ingreso_deadline_warning(ingreso, dias_restantes):
    return f"[SIE] - AVISO ({dias_restantes} días hábiles) - Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso_deadline_warning(ingreso, dias_restantes, absolute_url=None):
    fecha_responder_hasta = None
    if ingreso.fecha_ingreso_au:
        try:
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, 14)
        except Exception:
            pass

    return {
        "dias_restantes": dias_restantes,
        "numero_ingreso": ingreso.numero_ingreso,
        "tipo_recepcion": ingreso.tipo_recepcion.tipo if ingreso.tipo_recepcion else "",
        "tipo_solicitud": ingreso.tipo_solicitud.tipo if ingreso.tipo_solicitud else "",
        "depto_solicitante": ingreso.depto_solicitante.nombre if ingreso.depto_solicitante else "",
        "fecha_ingreso": ingreso.fecha_ingreso_au,
        "fecha_documento": ingreso.fecha_solicitud,
        "descripcion": ingreso.descripcion or "",
        "absolute_url": absolute_url or "",
        "fecha_responder_hasta": fecha_responder_hasta,
    }

def notify_ingreso_deadline_warning(ingreso, *, dias_restantes, absolute_url=None, bcc=None):
    # destinatarios: funcionarios vigentes
    to_list = [
        f.user.email
        for f in ingreso.funcionarios_asignados.select_related('user').all()
        if getattr(f, 'user', None) and getattr(f.user, 'email', None)
    ]
    to_list = list(dict.fromkeys([e for e in to_list if e]))

    if not to_list:
        return 0

    # CC: secretaria y coordinadora, evitando duplicados
    cc_list = []
    for extra in (SECRETARIA_EMAIL, COORDINADORA_EMAIL):
        if extra and extra not in to_list and extra not in cc_list:
            cc_list.append(extra)

    ctx = context_ingreso_deadline_warning(ingreso, dias_restantes, absolute_url=absolute_url)
    subject = subject_ingreso_deadline_warning(ingreso, dias_restantes)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER)

    text_body = render_to_string("bnup/emails/ingreso_deadline_warning.txt", ctx)
    html_body = render_to_string("bnup/emails/ingreso_deadline_warning.html", ctx)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=to_list,
        cc=cc_list,
        bcc=bcc or [],
    )
    msg.attach_alternative(html_body, "text/html")
    return msg.send(fail_silently=False)

# ─────────────────────────────────────────────────────────────────────────────
# EGRESO CREADO (respuesta a un ingreso)
# ─────────────────────────────────────────────────────────────────────────────

def subject_egreso_created(salida):
    ing = salida.ingreso_solicitud
    return f"[SIE] · Egreso N° {salida.numero_salida} · [Respuesta Ingreso N° {ing.numero_ingreso}]"

def context_egreso_created(salida, *, absolute_url=None):
    ing = salida.ingreso_solicitud

    # fecha límite = 14 días hábiles posteriores (15° hábil inclusivo)
    fecha_limite = None
    if ing and ing.fecha_ingreso_au:
        try:
            fecha_limite = add_business_days_cl(ing.fecha_ingreso_au, 14)
        except Exception:
            pass

    # funcionarios del egreso
    func_list = []
    for f in salida.funcionarios.select_related("user").all():
        email = getattr(getattr(f, "user", None), "email", "") or ""
        func_list.append({"id": f.id, "nombre": f.nombre, "email": email})

    # días hábiles de anticipación / atraso
    dias_anticipacion = None
    dias_atraso = None
    if fecha_limite and salida.fecha_salida:
        if salida.fecha_salida <= fecha_limite:
            dias_anticipacion = _business_days_between_cl(salida.fecha_salida, fecha_limite)
        else:
            dias_atraso = _business_days_between_cl(fecha_limite, salida.fecha_salida)

    return {
        # Ingreso
        "ingreso_numero":      ing.numero_ingreso if ing else "",
        "ingreso_tipo":        ing.tipo_solicitud.tipo if ing and ing.tipo_solicitud else "",
        "ingreso_recepcion":   ing.tipo_recepcion.tipo if ing and ing.tipo_recepcion else "",
        "ingreso_solicitante": ing.depto_solicitante.nombre if ing and ing.depto_solicitante else "",
        "ingreso_fecha":       ing.fecha_ingreso_au if ing else None,

        # Egreso
        "egreso_numero":       salida.numero_salida,
        "egreso_fecha":        salida.fecha_salida,
        "egreso_descripcion":  salida.descripcion or "",
        "egreso_funcionarios": func_list,

        # Nuevo: métricas de plazo
        "fecha_limite":        fecha_limite,       # (por si quieres mostrarla en otro lado)
        "dias_anticipacion":   dias_anticipacion,  # int o None
        "dias_atraso":         dias_atraso,        # int o None

        "absolute_url": absolute_url or "",
    }



def notify_egreso_created(salida, *, created_by_user=None, absolute_url=None, bcc=None, attach_file=False):
    """
    Envía correo cuando se registra un EGRESO (respuesta).
    - TO: funcionario que creó la respuesta (request.user.email)
    - CC: secretaria y coordinadora (si no están ya en TO)
    - (Adjunto desactivado por defecto; queda bloque comentado)
    """
    # TO: el creador de la respuesta
    to_list = []
    if created_by_user and getattr(created_by_user, "email", None):
        to_list.append(created_by_user.email)

    # Fallback opcional: si no hay email del creador, puedes incluir al primer funcionario de la salida
    if not to_list:
        first_f = salida.funcionarios.select_related("user").first()
        if first_f and getattr(getattr(first_f, "user", None), "email", None):
            to_list.append(first_f.user.email)

    # si aún no hay destinatarios, no enviamos
    if not to_list:
        return 0

    # CC: secretaria y coordinadora (sin duplicar)
    cc_list = []
    for fixed in (SECRETARIA_EMAIL, COORDINADORA_EMAIL):
        if fixed and fixed not in to_list:
            cc_list.append(fixed)

    ctx = context_egreso_created(salida, absolute_url=absolute_url)
    subject = subject_egreso_created(salida)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER)

    text_body = render_to_string("bnup/emails/egreso_created.txt", ctx)
    html_body = render_to_string("bnup/emails/egreso_created.html", ctx)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=to_list,
        cc=cc_list,
        bcc=bcc or [],
    )
    msg.attach_alternative(html_body, "text/html")

    # ─────────────────────────────────────────────────────────────
    # Adjuntar archivo (desactivado por defecto)
    # if attach_file and salida.archivo_adjunto_salida:
    #     try:
    #         msg.attach_file(salida.archivo_adjunto_salida.path)
    #     except Exception:
    #         pass
    # ─────────────────────────────────────────────────────────────

    return msg.send(fail_silently=False)

def _business_days_between_cl(start, end):
    """
    Días hábiles entre `start` (exclusivo) y `end` (inclusive) en Chile.
    Si start >= end → 0. No cuenta fines de semana ni feriados.
    """
    if not start or not end or start >= end:
        return 0
    years = {start.year, end.year, start.year - 1, end.year + 1}
    cl_holidays = holidays.country_holidays("CL", years=years)

    d = start
    count = 0
    while d < end:
        d += timedelta(days=1)
        if d.weekday() < 5 and d not in cl_holidays:
            count += 1
    return count