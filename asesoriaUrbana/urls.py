from django.contrib import admin
from django.urls import path, include 
from principal import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('inicio/', views.inicio, name='inicio'),
    path('bnup/', include('bnup.urls')),
    path('patente_alcohol/', include('patente_alcohol.urls')),  # Incluir URLs de la aplicación patente_alcohol
    path('informe_terreno/', include('informe_terreno.urls')),
    path('portal_transparencia/', views.portal_transparencia, name='portal_transparencia'),
    path('mapoteca/', views.mapoteca, name='mapoteca'),

    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),  # Nueva ruta para cerrar sesión
    path('change_password/', views.change_password, name='change_password'),



]

urlpatterns += static(settings.STATIC_URL, document_root = settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)

