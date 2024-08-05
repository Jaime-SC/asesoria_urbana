from django.urls import path
from .views import bnup_form

urlpatterns = [
    path('', bnup_form, name='bnup_form'),  # Asegúrate de que el nombre de la URL coincide con el usado en la plantilla
]
