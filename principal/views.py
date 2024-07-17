from django.shortcuts import render

def home(request):
    return render(request, 'home.html')  # Cambia 'pagina1.html' por el nombre de tu nueva plantilla que extiende base.html


def inicio(request):
    return render(request, 'asesoria_urbana.html')

def portal_transparencia(request):
    return render(request, 'portal_transparencia.html')