from datetime import date as date_class

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Q

from bnup.models import IngresoSOLICITUD
from bnup.services.notifications import (
    get_fecha_maxima_respuesta,
    INFORMATIVE_TIPO_IDS,
    TIPOS_FECHA_LIMITE_MANUAL,
)


class Command(BaseCommand):
    """
    Backfill parcial de IngresoSOLICITUD.fecha_maxima_respuesta.

    Reglas:
      - Solo procesa solicitudes ABIERTAS / EN TRÁMITE:
          * is_active=True
          * sin salidas activas (salidas__is_active=True)
      - Solo donde fecha_maxima_respuesta IS NULL.
      - Tipos 5/16:
          * Solo se rellenaría si existiera alguna fuente histórica explícita.
            (Hoy no hay otra columna equivalente → se dejan en NULL).
      - Resto de tipos:
          * Fecha calculada usando la lógica centralizada actual
            (get_fecha_maxima_respuesta), sin duplicar reglas.
    """

    help = "Backfill parcial de fecha_maxima_respuesta para ingresos abiertos/en trámite."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="No guarda cambios, solo muestra qué se haría.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Máximo de registros a procesar (para pruebas).",
        )
        parser.add_argument(
            "--only-year",
            type=int,
            default=None,
            help="Restringe a ingresos cuyo año de fecha_ingreso_au sea este (YYYY).",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]
        limit = opts.get("limit")
        only_year = opts.get("only_year")

        base_qs = (
            IngresoSOLICITUD.objects.filter(
                is_active=True,
                fecha_ingreso_au__isnull=False,
                fecha_maxima_respuesta__isnull=True,
            )
            # "Abiertas/en trámite": sin salidas activas
            .annotate(
                salidas_activas=Count(
                    "salidas", filter=Q(salidas__is_active=True)
                )
            )
            .filter(salidas_activas=0)
        )

        # No tocamos solicitudes informativas (11/12)
        base_qs = base_qs.exclude(tipo_solicitud_id__in=INFORMATIVE_TIPO_IDS)

        if only_year:
            base_qs = base_qs.filter(fecha_ingreso_au__year=only_year)

        total_candidatos = base_qs.count()
        if limit:
            qs = base_qs.order_by("id")[:limit]
        else:
            qs = base_qs.order_by("id")

        self.stdout.write(
            self.style.NOTICE(
                f"Candidatos totales (abiertos, sin fecha_maxima_respuesta, "
                f"is_active=True, sin salidas activas"
                f"{', año=' + str(only_year) if only_year else ''}): {total_candidatos}"
            )
        )
        if limit:
            self.stdout.write(self.style.NOTICE(f"Procesando como máximo: {limit} registros"))

        to_update = []
        errores = []
        skipped_manual = 0
        processed = 0

        for ing in qs.iterator():
            processed += 1
            tipo_id = getattr(ing, "tipo_solicitud_id", None)

            # Tipos con fecha manual (5/16):
            # Solo rellenaríamos si existiera una fuente histórica explícita
            # (hoy no la hay → se dejan en NULL).
            if tipo_id in TIPOS_FECHA_LIMITE_MANUAL:
                skipped_manual += 1
                continue

            try:
                nueva_fecha = get_fecha_maxima_respuesta(ing)
            except Exception as e:
                errores.append(
                    f"Ingreso id={ing.id} → error al calcular fecha_maxima_respuesta: {e}"
                )
                continue

            if not nueva_fecha:
                # Puede ocurrir en casos sin fecha_ingreso_au válida, o informativos (ya excluidos)
                errores.append(
                    f"Ingreso id={ing.id} → get_fecha_maxima_respuesta devolvió None; se omite."
                )
                continue

            ing.fecha_maxima_respuesta = nueva_fecha
            to_update.append(ing)

        self.stdout.write("")
        self.stdout.write(self.style.NOTICE(f"Evaluados: {processed}"))
        self.stdout.write(self.style.NOTICE(f"Tipo 5/16 sin fuente explícita (skipped): {skipped_manual}"))
        self.stdout.write(self.style.NOTICE(f"Con fecha calculada válida: {len(to_update)}"))
        self.stdout.write(self.style.NOTICE(f"Con errores/omitidos: {len(errores)}"))

        # Mostrar algunos ejemplos
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("Ejemplos de cambios (max 10):"))
        for ing in to_update[:10]:
            self.stdout.write(
                f"- id={ing.id} · tipo_id={ing.tipo_solicitud_id} · "
                f"fecha_ingreso={ing.fecha_ingreso_au} -> "
                f"fecha_maxima_respuesta={ing.fecha_maxima_respuesta}"
            )

        if errores:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Algunos registros no se pudieron procesar:"))
            for msg in errores[:10]:
                self.stderr.write(f"  {msg}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "[DRY-RUN] No se guardaron cambios. "
                    f"Se habrían actualizado {len(to_update)} registros."
                )
            )
            return

        if not to_update:
            self.stdout.write(self.style.SUCCESS("No hay registros que actualizar."))
            return

        # Guardado real
        self.stdout.write("")
        self.stdout.write(
            self.style.NOTICE(
                f"Aplicando cambios en {len(to_update)} registros (bulk_update)..."
            )
        )
        with transaction.atomic():
            IngresoSOLICITUD.objects.bulk_update(
                to_update, ["fecha_maxima_respuesta"], batch_size=500
            )

        self.stdout.write(self.style.SUCCESS("Backfill completado correctamente."))

