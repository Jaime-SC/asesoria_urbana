# bnup/management/commands/send_bnup_deadline_warnings.py
from datetime import date as date_class
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone
from bnup.models import IngresoSOLICITUD
from bnup.services.fecha_utils import add_business_days_cl
from bnup.services.notifications import notify_ingreso_deadline_warning, INFORMATIVE_TIPO_IDS

ABSOLUTE_URL = "http://asesoriaurbana.munivalpo.cl/"

TIPO_CONOC_Y_DIST_ID = 12      # Excluir
TIPO_ALCOHOL_ID      = 10      # Informe UV P. Alcohol (5 días)

# Defaults para el resto de tipos
DEFAULT_TOTAL_DIAS   = 15
DEFAULT_BUCKETS      = (5, 3, 1)   # días restantes

def get_deadline_policy(ing):
    """
    Devuelve (total_dias_habiles, buckets_de_aviso) según el tipo de solicitud.
    """
    if ing.tipo_solicitud_id == TIPO_ALCOHOL_ID:
        return (5, (3, 1))
    return (DEFAULT_TOTAL_DIAS, DEFAULT_BUCKETS)

class Command(BaseCommand):
    help = "Envía avisos de plazo restante (según tipo de solicitud) para solicitudes sin respuesta."

    def add_arguments(self, parser):
        parser.add_argument("--date", type=str, help="YYYY-MM-DD a usar como 'hoy' (testing).")
        parser.add_argument("--dry-run", action="store_true", help="No enviar correos; solo listar.")
        parser.add_argument("--only", type=str, help="IDs separados por coma para limitar el envío (p.ej. 12,34,56).")
        parser.add_argument(
            "--days",
            type=str,
            help="Restringe a ciertos avisos (p.ej. '5' o '5,3'). Si se omite, usa la política del tipo (p.ej. 3,1 para Alcohol; 5,3,1 para el resto)."
        )

    def handle(self, *args, **opts):
        # 1) 'hoy' simulado o real
        hoy = date_class.fromisoformat(opts["date"]) if opts.get("date") else timezone.localdate()

        # 2) QS base: activas, fecha_ingreso_au válida, sin respuesta, NO 'Conocimiento y Distribución'
        qs = (
            IngresoSOLICITUD.objects
            .filter(is_active=True, fecha_ingreso_au__isnull=False)
            .exclude(tipo_solicitud_id__in=INFORMATIVE_TIPO_IDS)   # ← antes: exclude(...=TIPO_CONOC_Y_DIST_ID)
            .annotate(salidas_activas=Count("salidas", filter=Q(salidas__is_active=True)))
            .filter(salidas_activas=0)
            .select_related("tipo_recepcion", "tipo_solicitud", "depto_solicitante")
            .prefetch_related("funcionarios_asignados__user")
        )

        # 3) Limitar por IDs si se pasó --only
        only = opts.get("only")
        if only:
            ids = [int(x) for x in only.split(",") if x.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        enviados = 0
        encontrados = 0

        for ing in qs:
            total_dias, policy_buckets = get_deadline_policy(ing)

            # Si el usuario forzó --days, respétalo (independiente del tipo)
            if opts.get("days"):
                try:
                    buckets = tuple(sorted({int(x.strip()) for x in opts["days"].split(",") if x.strip()}, reverse=True))
                except Exception:
                    buckets = policy_buckets
            else:
                buckets = policy_buckets

            # Regla inclusiva: el “último día” es el N-ésimo hábil contándose desde el día siguiente.
            # add_business_days_cl(start, k) devuelve la fecha al sumar k días hábiles EXCLUYENDO el start.
            # Por eso, para el “último día” usamos offset = total_dias - 1.
            ultimo_dia_offset = total_dias - 1

            for d in buckets:
                try:
                    # Aviso cuando faltan d días: offset = (total-1) - d
                    fecha_aviso = add_business_days_cl(ing.fecha_ingreso_au, ultimo_dia_offset - d)
                except Exception:
                    continue

                if fecha_aviso == hoy:
                    encontrados += 1
                    tipo_txt = ing.tipo_solicitud.tipo if ing.tipo_solicitud else ""
                    self.stdout.write(
                        f"Match → ID {ing.id} (N° {ing.numero_ingreso}) · tipo='{tipo_txt}' · total={total_dias} · quedan {d} días · aviso = {fecha_aviso.isoformat()}"
                    )
                    if not opts.get("dry_run"):
                        try:
                            notify_ingreso_deadline_warning(
                                ing,
                                dias_restantes=d,
                                absolute_url=ABSOLUTE_URL,
                                bcc=None
                            )
                            enviados += 1
                        except Exception as e:
                            self.stderr.write(f"Error al enviar ID {ing.id} (quedan {d}): {e}")

        if opts.get("dry_run"):
            self.stdout.write(self.style.WARNING(f"[DRY-RUN] Coincidencias: {encontrados}. No se envió ningún correo."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Avisos enviados: {enviados} (coincidencias: {encontrados})"))
