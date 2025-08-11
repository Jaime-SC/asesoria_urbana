from django.urls import path
from .views import bnup_form, statistics_view, delete_bnup_records, edit_bnup_record, create_salida, get_salidas, add_departamento, delete_salidas, report_view, edit_salida, egresos_au_fragment, egresos_au_list, egresos_au_create, validate_egreso_numero, delete_egresos_au

urlpatterns = [
    path('', bnup_form, name='bnup_form'),
    path('statistics/', statistics_view, name='statistics_view'),
    path('delete/', delete_bnup_records, name='delete_bnup_records'),
    path('edit/', edit_bnup_record, name='edit_bnup_record'),
    path('create_salida/', create_salida, name='create_salida'),
    path('delete_salidas/', delete_salidas, name='delete_salidas'),
    path('get_salidas/<int:solicitud_id>/', get_salidas, name='get_salidas'),
    path('add_departamento/', add_departamento, name='add_departamento'),  # Nueva ruta
    path('report/', report_view, name='report_view'),
    # urls.py
    path('edit_salida/', edit_salida, name='edit_salida'),
    path('egresos_au_fragment/', egresos_au_fragment, name='egresos_au_fragment'),
    path('egresos_au_list/',     egresos_au_list,     name='egresos_au_list'),
    path('egresos_au_create/',   egresos_au_create,   name='egresos_au_create'),
    path("egresos_au/validate_numero/", validate_egreso_numero, name="validate_egreso_numero"),
    path('egresos_au/delete/', delete_egresos_au, name='delete_egresos_au'),
]
