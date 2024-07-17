# patente_alcohol/urls.py
from django.urls import path
from .views import patente_form

urlpatterns = [
    path('', patente_form, name='patente_form'),
]
