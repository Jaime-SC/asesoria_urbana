# bnup/services/fecha_utils.py
from datetime import timedelta
import holidays

def add_business_days_cl(start_date, business_days):
    """
    Devuelve la fecha resultante de sumar `business_days` días hábiles en Chile,
    contados desde el día siguiente a `start_date`.
    Excluye sábados, domingos y feriados oficiales de Chile (librería `holidays`).
    """
    # cubrimos años adyacentes por si cruza año
    years = {start_date.year, start_date.year + 1, start_date.year - 1}
    cl_holidays = holidays.country_holidays("CL", years=years)

    d = start_date
    added = 0
    while added < business_days:
        d += timedelta(days=1)  # "posteriores": comenzamos al día siguiente
        if d.weekday() < 5 and d not in cl_holidays:
            added += 1
    return d
