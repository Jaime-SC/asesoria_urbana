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
]
