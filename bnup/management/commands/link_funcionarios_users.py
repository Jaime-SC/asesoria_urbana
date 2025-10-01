# bnup/management/commands/link_funcionarios_users.py
import csv
import unicodedata
from difflib import SequenceMatcher

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from bnup.models import Funcionario

User = get_user_model()


def strip_accents(s: str) -> str:
    if s is None:
        return ""
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s: str) -> str:
    s = strip_accents(s or "").lower().strip()
    parts = s.split()
    return " ".join(parts)


def split_nombre_funcionario(nombre: str):
    """
    - first_name = primer token
    - last_name  = resto (puede ser apellido compuesto)
    """
    nombre = (nombre or "").strip()
    if not nombre:
        return "", ""
    tokens = nombre.split()
    if len(tokens) == 1:
        return tokens[0], ""
    return tokens[0], " ".join(tokens[1:])


def full_norm(u) -> str:
    # "first_name last_name" normalizado
    return norm(f"{getattr(u, 'first_name', '')} {getattr(u, 'last_name', '')}")


def full_norm_raw(first_name: str, last_name: str) -> str:
    return norm(f"{first_name} {last_name}")


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# --- FALLBACK 100% PYTHON POR APELLIDOS ---
def py_candidates_by_lastname_tokens(all_users, last_name: str):
    """
    Retorna usuarios cuyo last_name (normalizado sin acentos) contiene TODOS
    los tokens de 'last_name' (también normalizado).
    """
    tokens = [t for t in norm(last_name).split() if t]
    results = []
    if not tokens:
        return results
    for u in all_users:
        u_ln = norm(getattr(u, 'last_name', ''))
        if all(tok in u_ln for tok in tokens):
            results.append(u)
    return results


class Command(BaseCommand):
    help = (
        "Vincula funcionarios (bnup_funcionario) con usuarios (auth_user). "
        "Estrategias por email/username/name, mapa CSV opcional, y dry-run por defecto."
    )

    def add_arguments(self, parser):
        parser.add_argument('--by', choices=['email', 'username', 'name'], default='name',
                            help="Estrategia primaria (default: name)")
        parser.add_argument('--csv', type=str, default=None,
                            help="CSV con columnas: funcionario,username|email (mapeo forzado).")
        parser.add_argument('--apply', action='store_true', help="Guarda cambios (por defecto dry-run).")
        parser.add_argument('--strict', action='store_true', help="Solo exactos; sin heurística.")
        parser.add_argument('--min-sim', type=float, default=0.88, help="Umbral fuzzy (default 0.88).")

    def load_csv_map(self, path):
        map_by_username, map_by_email = {}, {}
        if not path:
            return map_by_username, map_by_email
        with open(path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            cols = [c.strip().lower() for c in (reader.fieldnames or [])]
            if 'funcionario' not in cols:
                raise ValueError("El CSV debe tener columna 'funcionario'.")
            if 'username' not in cols and 'email' not in cols:
                raise ValueError("El CSV debe tener columna 'username' o 'email'.")
            for row in reader:
                key = norm(row.get('funcionario', ''))
                if not key:
                    continue
                if row.get('username'):
                    map_by_username[key] = row['username'].strip()
                if row.get('email'):
                    map_by_email[key] = row['email'].strip().lower()
        return map_by_username, map_by_email

    def handle(self, *args, **options):
        strategy = options['by']
        apply_changes = options['apply']
        strict = options['strict']
        min_sim = options['min_sim']
        csv_path = options['csv']

        map_by_username, map_by_email = self.load_csv_map(csv_path)

        self.stdout.write(self.style.MIGRATE_HEADING("=== Vinculación Funcionario ↔ User ==="))
        self.stdout.write(f"Estrategia: {strategy} | strict={strict} | dry-run={not apply_changes} | min_sim={min_sim}")
        if csv_path:
            self.stdout.write(f"Mapa CSV: {csv_path} (usernames: {len(map_by_username)}, emails: {len(map_by_email)})")

        linked = skipped = ambiguous = 0

        # Pre-carga todos los usuarios para comparaciones en memoria (rápido con pocos cientos)
        all_users = list(User.objects.all().only('id', 'username', 'email', 'first_name', 'last_name'))
        norm_to_user = {full_norm(u): u for u in all_users}

        with transaction.atomic():
            for f in Funcionario.objects.all():
                raw_nombre = (f.nombre or "").strip()
                if not raw_nombre:
                    skipped += 1
                    self.stdout.write(self.style.WARNING(f"[Sin nombre] Funcionario id={f.id}"))
                    continue

                # Omitir entradas no personales
                if norm(raw_nombre).startswith("departamento "):
                    skipped += 1
                    self.stdout.write(self.style.NOTICE(f"[Omitido no-persona] '{raw_nombre}'"))
                    continue

                key_norm = norm(raw_nombre)
                user = None
                reason = "N/A"

                # 1) CSV (mapeo forzado si existe)
                if key_norm in map_by_username:
                    user = next((u for u in all_users if u.username.lower() == map_by_username[key_norm].lower()), None)
                    reason = f"CSV(username={map_by_username[key_norm]})"
                elif key_norm in map_by_email:
                    user = next((u for u in all_users if (u.email or "").lower() == map_by_email[key_norm]), None)
                    reason = f"CSV(email={map_by_email[key_norm]})"
                else:
                    # 2) Estrategias
                    if strategy == 'email':
                        reason = "by=email (sin fuente de email en Funcionario)"
                        user = None
                    elif strategy == 'username':
                        reason = "by=username (sin mapa)"
                        user = None
                    else:
                        # by=name
                        f_first, f_last = split_nombre_funcionario(raw_nombre)
                        f_full_norm = full_norm_raw(f_first, f_last)

                        # 2.a) exacto normalizado
                        user = norm_to_user.get(f_full_norm)
                        reason = "name: exact(norm)"

                        # 2.b) exacto por campos crudos (sobre all_users)
                        if not user:
                            for u in all_users:
                                if (u.first_name or "").strip().lower() == f_first.strip().lower() and \
                                   (u.last_name or "").strip().lower() == f_last.strip().lower():
                                    user = u
                                    reason = "name: exact(in-memory)"
                                    break

                        # 2.c) heurística (mismo first_name, last_name contiene cadena)
                        if not user and not strict:
                            candidates = [
                                u for u in all_users
                                if (u.first_name or "").strip().lower() == f_first.strip().lower() and
                                   (f_last.strip().lower() in (u.last_name or "").strip().lower())
                            ]
                            if len(candidates) == 1:
                                user = candidates[0]
                                reason = "name: single candidate (icontains, in-memory)"
                            elif len(candidates) > 1:
                                best, best_sim = None, 0.0
                                for u in candidates:
                                    sim = similarity(f_full_norm, full_norm(u))
                                    if sim > best_sim:
                                        best, best_sim = u, sim
                                if best and best_sim >= min_sim:
                                    user = best
                                    reason = f"name: fuzzy best_sim={best_sim:.3f}"

                        # 2.d) FALLBACK POR APELLIDOS (100% Python, sin DB)
                        if not user and f_last.strip():
                            ln_candidates = py_candidates_by_lastname_tokens(all_users, f_last)
                            if ln_candidates:
                                self.stdout.write(self.style.HTTP_INFO(
                                    f"[Apellido] '{raw_nombre}' candidatos_por_apellido={len(ln_candidates)}"
                                ))
                            if len(ln_candidates) == 1:
                                user = ln_candidates[0]
                                reason = "lastname: all tokens (single, py)"
                            elif len(ln_candidates) > 1 and not strict:
                                best, best_sim = None, 0.0
                                for u in ln_candidates:
                                    sim = similarity(f_full_norm, full_norm(u))
                                    # pequeño bonus si coincide la inicial del nombre
                                    if u.first_name and f_first and norm(u.first_name[:1]) == norm(f_first[:1]):
                                        sim += 0.02
                                    if sim > best_sim:
                                        best, best_sim = u, sim
                                if best and best_sim >= (min_sim - 0.03):
                                    user = best
                                    reason = f"lastname: tokens+fuzzy (py) best_sim={best_sim:.3f}"
                                else:
                                    self.stdout.write(self.style.NOTICE(
                                        f"[Ambiguo] '{raw_nombre}' (lastname tokens, py) candidatos={len(ln_candidates)}"
                                    ))
                                    ambiguous += 1

                # Persistencia / reporte
                if user:
                    msg = f"Vinculado: '{raw_nombre}' -> {user.username} ({reason})"
                    if apply_changes:
                        f.user = user
                        f.save(update_fields=['user'])
                        self.stdout.write(self.style.SUCCESS(msg + " [APLICADO]"))
                    else:
                        self.stdout.write(self.style.SUCCESS(msg + " [DRY-RUN]"))
                    linked += 1
                else:
                    self.stdout.write(self.style.WARNING(f"Sin vínculo: '{raw_nombre}' ({reason})"))
                    skipped += 1

            if not apply_changes:
                transaction.set_rollback(True)

        self.stdout.write(self.style.MIGRATE_HEADING("=== Resumen ==="))
        self.stdout.write(self.style.SUCCESS(f"Vinculados: {linked}"))
        self.stdout.write(self.style.WARNING(f"Sin vínculo: {skipped}"))
        self.stdout.write(self.style.NOTICE(f"Ambiguos: {ambiguous}"))
        self.stdout.write(self.style.HTTP_INFO("Tip: si aún faltan, usa --csv para fijarlos y luego --apply."))
