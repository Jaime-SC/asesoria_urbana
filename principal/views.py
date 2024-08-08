from django.shortcuts import render

def home(request):
    # Limpiar la bandera de redirección después de usarla
    redirect_to_bnup = request.session.pop('redirect_to_bnup', False)
    return render(request, 'home.html', {
        'redirect_to_bnup': redirect_to_bnup
    })


def inicio(request):
    return render(request, 'asesoria_urbana.html')

def portal_transparencia(request):
    return render(request, 'portal_transparencia.html')

def mapoteca(request):
    return render(request, 'mapoteca.html')