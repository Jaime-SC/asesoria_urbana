# bnup/views.py
from django.shortcuts import render

def patente_form(request):
    return render(request, 'patente_alcohol/form.html')
