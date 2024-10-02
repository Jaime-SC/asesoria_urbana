from django.urls import path
from .views import bnup_form, statistics_view, delete_bnup_records

urlpatterns = [
    path('', bnup_form, name='bnup_form'),
    path('statistics/', statistics_view, name='statistics_view'),
    path('delete/', delete_bnup_records, name='delete_bnup_records'),
]