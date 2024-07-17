# informe_terreno/views.py
from django.shortcuts import render

def informe_form(request):
    return render(request, 'informe_terreno/form.html')

