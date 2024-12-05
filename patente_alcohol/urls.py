# patente_alcohol/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path("", views.patente_form, name="patente_form"),
    path(
        "create/",
        views.create_solicitud_patente_alcohol,
        name="create_solicitud_patente_alcohol",
    ),
    path(
        "create_salida/",
        views.create_salida_patente_alcohol,
        name="create_salida_patente_alcohol",
    ),  # Nueva ruta añadida
    path(
        "detail/<int:solicitud_id>/",
        views.get_solicitud_details,
        name="get_solicitud_details",
    ),
    path(
        "detail_salida/<int:solicitud_id>/",
        views.get_salida_details,
        name="get_salida_details",
    ),  # Nueva ruta
    path(
        "update_numero_ingreso/",
        views.update_numero_ingreso,
        name="update_numero_ingreso",
    ),  # Nueva ruta para actualizar número de ingreso
]
