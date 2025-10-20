from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from bnup.services.fecha_utils import add_business_days_cl
from datetime import timedelta
import holidays


import logging
import unicodedata

LOG = logging.getLogger(__name__)

# Correos para pruebas
# JEFE_EMAIL         = "ingresos.egresos.au@gmail.com"
# COORDINADORA_EMAIL = "darumairui@gmail.com"
# SECRETARIA_EMAIL   = "jaimeqsanchezc@gmail.com"


# # Correos fijos (producción)
JEFE_EMAIL          = "ptapia@munivalpo.cl"
COORDINADORA_EMAIL  = "joanna.bastias@munivalpo.cl"
SECRETARIA_EMAIL    = "dpalacios@munivalpo.cl"


# Políticas de plazo según tipo de solicitud
TIPO_CONOC_Y_DIST_ID = 12
TIPO_DECRETO_ALCALDICIO_ID = 11
TIPO_ALCOHOL_ID      = 10


def _norm_text(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = "".join(ch if ch.isalnum() else " " for ch in s)
    return " ".join(s.lower().split())

def _es_decreto_alcaldicio(obj):
    """
    True si el objeto es un Ingreso tipo 11 (Decreto Alcaldicio) o
    si es una Salida cuyo ingreso asociado es tipo 11.
    """
    ing = obj if hasattr(obj, "tipo_solicitud_id") else getattr(obj, "ingreso_solicitud", None)
    return getattr(ing, "tipo_solicitud_id", None) == TIPO_DECRETO_ALCALDICIO_ID


# nombres de campo backend que sabemos son el adjunto del ingreso
_ATTACHMENT_FIELD_KEYS = {
    "archivo_adjunto_ingreso",
    "documento_entrada",
    "documento_de_entrada",
    "archivo_ingreso",
    "archivo_entrada",
}

def _is_allowed_update_label(label: str) -> bool:
    # número de ingreso o claves backend de adjunto
    if not label:
        return False
    if label in {"numero_ingreso"} or label in _ATTACHMENT_FIELD_KEYS:
        return True

    n = _norm_text(label)
    tokens = set(n.split())

    # “número ingreso/entrada” con variantes
    if any(t in tokens for t in {"numero", "num", "nro", "no", "n"}) and (("ingreso" in tokens) or ("entrada" in tokens)):
        return True

    # Archivo/Adjunto/Documento (+ opcional ingreso/entrada)
    if ({"archivo", "adjunto", "documento", "doc", "pdf"} & tokens) and (("ingreso" in tokens) or ("entrada" in tokens)):
        return True

    # “documento de entrada”
    if "documento" in tokens and "entrada" in tokens:
        return True

    # ÚLTIMA RED (por si el label llega como “Archivo” a secas):
    if {"archivo", "adjunto", "documento", "doc", "pdf"} & tokens:
        return True

    return False

def _is_fileish(v) -> bool:
    # Detecta objetos FileField/File, rutas o nombres con extensión
    if v is None:
        return False
    name = getattr(v, "name", None) or str(v)
    name = name.lower()
    return any(ext in name for ext in (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".zip", ".rar"))

def _looks_like_attachment_change(label, old, new) -> bool:
    # Si el label ya calza con nuestra whitelist, listo
    if _is_allowed_update_label(label):
        return True
    # Si cualquiera de los lados “parece archivo”, también lo tratamos como adjunto
    if _is_fileish(old) or _is_fileish(new):
        return True
    return False


def get_deadline_policy_for_ingreso(ingreso):
    """
    Devuelve (total_dias_habiles, buckets) para el ingreso dado.
    """
    if getattr(ingreso, "tipo_solicitud_id", None) == TIPO_ALCOHOL_ID:
        return (5, (3, 1))
    return (15, (5, 3, 1))


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
    return f"[SIE] · [{ingreso.tipo_solicitud.tipo}] · Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso(ingreso, absolute_url=None):
    # flag tipo conocimiento
    es_conocimiento = getattr(ingreso, "tipo_solicitud_id", None) == TIPO_CONOC_Y_DIST_ID

    fecha_responder_hasta = None
    plazo_total = None  # por defecto sin plazo

    if not es_conocimiento and ingreso.fecha_ingreso_au:
        try:
            plazo_total, _ = get_deadline_policy_for_ingreso(ingreso)  # 5 Alcohol, 15 resto
            # inclusivo: último día = total-1
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, plazo_total - 1)
        except Exception:
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
        "plazo_total": plazo_total,          # None si es conocimiento
        "es_conocimiento": es_conocimiento,  # ← NUEVO
    }


def notify_ingreso_created(ingreso, *, absolute_url=None, bcc=None, attach_file=False, include_solicitante=False):
    """
    Envía correo HTML+texto cuando se crea un Ingreso.
    - include_solicitante: si True, copia al solicitante.
    - attach_file: False por defecto (no adjuntar para incentivar uso del sistema).
    """
    if _es_decreto_alcaldicio(ingreso):
        LOG.info("notify_ingreso_created: skip (Decreto Alcaldicio) ingreso_id=%s", getattr(ingreso, "id", None))
        return 0
    
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
    return f"[SIE] · ACTUALIZADO · Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso_updated(ingreso, *, absolute_url=None, added=None, removed=None, field_changes=None):
    fecha_responder_hasta = None
    if ingreso.fecha_ingreso_au:
        try:
            total_dias, _ = get_deadline_policy_for_ingreso(ingreso)
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, total_dias - 1)
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
    Notifica por correo que el Ingreso fue ACTUALIZADO **solo** si:
      - cambia el número de ingreso, o
      - se agregan/eliminen funcionarios, o
      - cambia el archivo adjunto del ingreso.

    Envía a los funcionarios actuales; CC a secretaria; sin adjuntos.
    """

    if _es_decreto_alcaldicio(ingreso):
        LOG.info("notify_ingreso_updated: skip (Decreto Alcaldicio) ingreso_id=%s", getattr(ingreso, "id", None))
        return 0

    # 1) Filtrar cambios permitidos por etiqueta/nombre de campo + heurística de archivo
    field_changes = field_changes or []
    allowed_field_changes = []
    skipped = []

    for (lbl, old, new) in field_changes:
        if _is_allowed_update_label(lbl) or _looks_like_attachment_change(lbl, old, new):
            allowed_field_changes.append((lbl, old, new))
        else:
            skipped.append(lbl)

    # 2) Detectar cambios de funcionarios
    added = added or []
    removed = removed or []
    funcionarios_changed = bool(added or removed)

    # 3) Cortar notificación si no hay nada relevante
    if not allowed_field_changes and not funcionarios_changed:
        # (Opcional) Log para diagnosticar por qué no se envió
        if skipped:
            LOG.info(
                "notify_ingreso_updated: sin envio (labels filtrados): %s",
                ", ".join(map(str, skipped))
            )
        return 0


    # 4) Destinatarios: funcionarios vigentes
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

    # 5) Contexto con SOLO lo permitido
    ctx = context_ingreso_updated(
        ingreso,
        absolute_url=absolute_url,
        added=added,
        removed=removed,
        field_changes=allowed_field_changes,   # ← sólo cambios permitidos
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
    return f"[SIE] · AVISO ({dias_restantes} días hábiles) · Ingreso N° {ingreso.numero_ingreso}"

def context_ingreso_deadline_warning(ingreso, dias_restantes, absolute_url=None):
    # plazo por tipo
    total_dias, _ = get_deadline_policy_for_ingreso(ingreso)
    # inclusivo: último día = offset total-1
    fecha_responder_hasta = None
    if ingreso.fecha_ingreso_au:
        try:
            fecha_responder_hasta = add_business_days_cl(ingreso.fecha_ingreso_au, total_dias - 1)
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

    if _es_decreto_alcaldicio(ingreso):
        LOG.info("notify_ingreso_deadline_warning: skip (Decreto Alcaldicio) ingreso_id=%s", getattr(ingreso, "id", None))
        return 0

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

    # fecha límite según política por tipo (inclusivo: total_dias - 1)
    fecha_limite = None
    if ing and ing.fecha_ingreso_au:
        try:
            total_dias, _ = get_deadline_policy_for_ingreso(ing)
            fecha_limite = add_business_days_cl(ing.fecha_ingreso_au, total_dias - 1)
        except Exception:
            pass

    # funcionarios del egreso
    func_list = []
    for f in salida.funcionarios.select_related("user").all():
        email = getattr(getattr(f, "user", None), "email", "") or ""
        func_list.append({"id": f.id, "nombre": f.nombre, "email": email})

    # días hábiles de anticipación / atraso (respecto a la fecha límite calculada)
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

        # Métricas de plazo
        "fecha_limite":        fecha_limite,
        "dias_anticipacion":   dias_anticipacion,
        "dias_atraso":         dias_atraso,

        "absolute_url": absolute_url or "",
    }


def notify_egreso_created(salida, *, created_by_user=None, absolute_url=None, bcc=None, attach_file=False):
    """
    Envía correo cuando se registra un EGRESO (respuesta).

    - TO: funcionarios asignados a la salida (salida.funcionarios[*].user.email)
      (fallback: Secretaría si no hay funcionarios)
    - CC (en este orden): Jefe, Coordinadora, Secretaría (evitando duplicados)
    - (Adjunto desactivado por defecto; queda bloque comentado)
    """

    if _es_decreto_alcaldicio(salida):
        LOG.info("notify_egreso_created: skip (Decreto Alcaldicio) salida_id=%s", getattr(salida, "id", None))
        return 0

    # TO: funcionarios encargados del egreso
    to_list = [
        getattr(getattr(f, "user", None), "email", None)
        for f in salida.funcionarios.select_related("user").all()
    ]
    to_list = [e for e in to_list if e]                 # limpia None/"" 
    to_list = list(dict.fromkeys(to_list))              # uniq conservando orden

    # Fallback si no hay funcionarios: mandar a Secretaría
    if not to_list and SECRETARIA_EMAIL:
        to_list = [SECRETARIA_EMAIL]

    if not to_list:
        LOG.info("notify_egreso_created: sin envío (no hay destinatarios TO)")
        return 0

    # CC: Jefe → Coordinadora → Secretaría (sin duplicados)
    cc_list = []
    for extra in (JEFE_EMAIL, COORDINADORA_EMAIL, SECRETARIA_EMAIL):
        if extra and extra not in to_list and extra not in cc_list:
            cc_list.append(extra)

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