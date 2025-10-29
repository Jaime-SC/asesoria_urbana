from datetime import date, timedelta
import holidays
from django.conf import settings

def _cl_holidays_for_years(years):
    """
    Construye el set de feriados chilenos para los años dados y mezcla feriados extra
    definidos en settings.SIE_EXTRA_HOLIDAYS = {"YYYY-MM-DD": "Nombre del feriado", ...}
    """
    cl = holidays.country_holidays("CL", years=years)

    extra = getattr(settings, "SIE_EXTRA_HOLIDAYS", {})
    if isinstance(extra, dict):
        for s, name in extra.items():
            try:
                d = date.fromisoformat(s)
            except Exception:
                continue
            if d.year in years:
                cl[d] = name
    return cl

def add_business_days_cl(start_date, business_days):
    """
    Suma `business_days` días hábiles en Chile a partir del día siguiente a start_date.
    Excluye sábados, domingos y feriados (incluye extras definidos en settings).
    """
    years = {start_date.year, start_date.year - 1, start_date.year + 1}
    cl_holidays = _cl_holidays_for_years(years)

    d = start_date
    added = 0
    while added < business_days:
        d += timedelta(days=1)
        if d.weekday() < 5 and d not in cl_holidays:
            added += 1
    return d

def business_days_between_cl(start_date, end_date, *, include_start=False, include_end=True):
    """
    Cuenta días hábiles entre start_date y end_date.
    Por defecto: excluye el start, incluye el end (útil para “plazo hasta”).
    """
    if start_date > end_date:
        start_date, end_date = end_date, start_date

    years = {start_date.year, end_date.year, start_date.year - 1, end_date.year + 1}
    cl_holidays = _cl_holidays_for_years(years)

    current = start_date if include_start else (start_date + timedelta(days=1))
    last = end_date if include_end else (end_date - timedelta(days=1))

    days = 0
    while current <= last:
        if current.weekday() < 5 and current not in cl_holidays:
            days += 1
        current += timedelta(days=1)
    return days

def list_holidays_cl_between(start_date, end_date):
    """
    Lista [(fecha, nombre)] de feriados entre start_date y end_date (ambos inclusive).
    Considera feriados nacionales y extras de settings.
    """
    if start_date > end_date:
        start_date, end_date = end_date, start_date

    years = {start_date.year, end_date.year, start_date.year - 1, end_date.year + 1}
    cl_holidays = _cl_holidays_for_years(years)

    out = []
    d = start_date
    while d <= end_date:
        if d in cl_holidays:
            out.append((d, cl_holidays.get(d)))
        d += timedelta(days=1)
    return out
