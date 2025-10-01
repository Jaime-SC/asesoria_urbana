# bnup/management/commands/send_bnup_deadline_warnings.py
from datetime import date as date_class
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone
from bnup.models import IngresoSOLICITUD
from bnup.services.fecha_utils import add_business_days_cl
from bnup.services.notifications import notify_ingreso_deadline_warning

ABSOLUTE_URL = "http://asesoriaurbana.munivalpo.cl/"
TIPO_CONOC_Y_DIST_ID = 12  # "Conocimiento y Distribución"

DAYS_BUCKETS = (5, 3, 1)  # días hábiles restantes

class Command(BaseCommand):
    help = "Envía avisos de plazo restante (5, 3 y 1 día hábil) para solicitudes sin respuesta."

    def add_arguments(self, parser):
        parser.add_argument("--date", type=str, help="YYYY-MM-DD a usar como 'hoy' (testing).")
        parser.add_argument("--dry-run", action="store_true", help="No enviar correos; solo listar.")
        parser.add_argument("--only", type=str, help="IDs separados por coma para limitar el envío (p.ej. 12,34,56).")
        parser.add_argument(
            "--days",
            type=str,
            help="Restringe a ciertos avisos (p.ej. '5' o '5,3'). Por defecto: 5,3,1."
        )

    def handle(self, *args, **opts):
        # 1) 'hoy' simulado o real
        if opts.get("date"):
            hoy = date_class.fromisoformat(opts["date"])
        else:
            hoy = timezone.localdate()

        # 2) buckets de días a usar
        if opts.get("days"):
            try:
                buckets = tuple(sorted({int(x.strip()) for x in opts["days"].split(",") if x.strip()} , reverse=True))
            except Exception:
                buckets = DAYS_BUCKETS
        else:
            buckets = DAYS_BUCKETS

        # 3) QS base: activas, fecha_ingreso_au válida, sin respuesta, NO 'Conocimiento y Distribución'
        qs = (
            IngresoSOLICITUD.objects
            .filter(is_active=True, fecha_ingreso_au__isnull=False)
            .exclude(tipo_solicitud_id=TIPO_CONOC_Y_DIST_ID)
            .annotate(salidas_activas=Count("salidas", filter=Q(salidas__is_active=True)))
            .filter(salidas_activas=0)
            .select_related("tipo_recepcion", "tipo_solicitud", "depto_solicitante")
            .prefetch_related("funcionarios_asignados__user")
        )

        # 4) Limitar por IDs si se pasó --only
        only = opts.get("only")
        if only:
            ids = [int(x) for x in only.split(",") if x.strip().isdigit()]
            qs = qs.filter(id__in=ids)

        enviados = 0
        encontrados = 0

        for ing in qs:
            # Para cada bucket (5,3,1), calculamos la fecha de aviso:
            # Fecha límite = fecha_ingreso_au + 15 días hábiles
            # Aviso cuando faltan D días = fecha_ingreso_au + (15 - D) días hábiles
            for d in buckets:
                try:
                    fecha_aviso = add_business_days_cl(ing.fecha_ingreso_au, 14 - d)
                except Exception:
                    continue

                if fecha_aviso == hoy:
                    encontrados += 1
                    self.stdout.write(f"Match → ID {ing.id} (N° {ing.numero_ingreso}) · quedan {d} días · aviso = {fecha_aviso.isoformat()}")
                    if not opts.get("dry_run"):
                        try:
                            notify_ingreso_deadline_warning(
                                ing,
                                dias_restantes=d,              # ← clave: pasamos el bucket
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
