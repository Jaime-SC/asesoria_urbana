from django.shortcuts import render

def home(request):
    return render(request, 'home.html')  # Cambia 'pagina1.html' por el nombre de tu nueva plantilla que extiende base.html
