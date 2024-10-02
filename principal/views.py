from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib import messages
from principal.models import PerfilUsuario  # Importar el modelo PerfilUsuario

def home(request):
    # Limpiar las banderas de redirección y de alerta después de usarlas
    redirect_to_bnup = request.session.pop('redirect_to_bnup', False)
    show_sweetalert = request.session.pop('show_sweetalert', None)
    
    perfil_usuario = None
    if request.user.is_authenticated:
        # Obtener el perfil del usuario si está autenticado
        perfil_usuario = PerfilUsuario.objects.filter(user=request.user).first()

    return render(request, 'home.html', {
        'redirect_to_bnup': redirect_to_bnup,
        'perfil_usuario': perfil_usuario,  # Enviar el perfil al contexto
        'show_sweetalert': show_sweetalert  # Enviar la variable al contexto
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
            # Obtener el perfil del usuario
            perfil_usuario = PerfilUsuario.objects.filter(user=user).first()

            # Verificar si el tipo de usuario es permitido
            if perfil_usuario and perfil_usuario.tipo_usuario.nombre in ['ADMIN', 'PRIVILEGIADO', 'ALIMENTADOR', 'VISUALIZADOR']:
                auth_login(request, user)
                request.session['show_sweetalert'] = 'login_success'
                return redirect('home')
            else:
                request.session['show_sweetalert'] = 'login_error'
                return redirect('home')
        else:
            # En caso de error, establecer un indicador de error en la sesión
            request.session['show_sweetalert'] = 'login_error'
            return redirect('home')

    return render(request, 'login.html')

def logout(request):
    auth_logout(request)
    request.session['show_sweetalert'] = 'logout_success'
    return redirect('home')
