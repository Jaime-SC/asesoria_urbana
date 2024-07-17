# bnup/views.py
from django.shortcuts import render

def bnup_form(request):
    return render(request, 'bnup/form.html')
