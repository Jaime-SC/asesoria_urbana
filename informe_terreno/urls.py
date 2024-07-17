# informe_terreno/urls.py
from django.urls import path
from .views import informe_form

urlpatterns = [
    path('', informe_form, name='informe_form'),
]
