from django.contrib import admin

# Register your models here.
# bnup/admin.py
from django.contrib import admin
from .models import Departamento, Funcionario, SeccionFuncionario, IngresoSOLICITUD, SalidaSOLICITUD, EgresoAU

@admin.register(SeccionFuncionario)
class SeccionFuncionarioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "incluye_todos")
    search_fields = ("nombre",)
    filter_horizontal = ("funcionarios",)


admin.site.register(Departamento)
admin.site.register(Funcionario)
admin.site.register(IngresoSOLICITUD)
admin.site.register(SalidaSOLICITUD)
admin.site.register(EgresoAU)
