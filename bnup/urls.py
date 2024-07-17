# bnup/urls.py
from django.urls import path
from .views import bnup_form

urlpatterns = [
    path('', bnup_form, name='bnup_form'),
]
