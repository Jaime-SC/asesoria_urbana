# urls.py

from django.urls import path
from .views import bnup_form, statistics_view, delete_bnup_records, edit_bnup_record, create_salida, get_salidas, add_departamento, delete_salidas, report_view, edit_salida

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

]
