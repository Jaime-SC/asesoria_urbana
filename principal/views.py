from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib import messages

def home(request):
    # Limpiar la bandera de redirección después de usarla
    redirect_to_bnup = request.session.pop('redirect_to_bnup', False)
    if request.method == 'POST' and request.body:
        # Si se recibe una solicitud POST para limpiar la sesión
        request.session.pop('show_sweetalert', None)  # Limpiar la sesión
        return redirect('home')

    return render(request, 'home.html', {
        'redirect_to_bnup': redirect_to_bnup
    })



def inicio(request):
    return render(request, 'asesoria_urbana.html')

def portal_transparencia(request):
    return render(request, 'portal_transparencia.html')

def mapoteca(request):
    return render(request, 'mapoteca.html')

def login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            # messages.success(request, 'Has iniciado sesión correctamente.')
            request.session['show_sweetalert'] = 'login_success'
            return redirect('home')
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')

    return render(request, 'login.html')

def logout(request):
    auth_logout(request)
    # messages.success(request, 'Has cerrado sesión correctamente.')
    request.session['show_sweetalert'] = 'logout_success'
    return redirect('home')

