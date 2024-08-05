from django.shortcuts import render, redirect
from .models import SolicitudBNUP, Departamento, Funcionario, TipoRecepcion
from django.contrib import messages

def bnup_form(request):
    if request.method == 'POST':
        # Extraer datos del formulario
        tipo_recepcion_id = request.POST.get('tipo_recepcion')
        numero_memo = request.POST.get('num_memo') if tipo_recepcion_id == '1' else None
        correo_solicitante = request.POST.get('correo_solicitante') if tipo_recepcion_id == '2' else None
        depto_solicitante_id = request.POST.get('depto_solicitante')
        nombre_solicitante = request.POST.get('nombre_solicitante')
        numero_ingreso = request.POST.get('numero_ingreso')
        fecha_ingreso = request.POST.get('fecha_ingreso')
        funcionario_asignado_id = request.POST.get('funcionario_asignado')
        descripcion = request.POST.get('descripcion')

        # Verificar que el ID de tipo de recepción es válido
        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)
            funcionario_asignado = Funcionario.objects.get(id=funcionario_asignado_id)

            # Crear y guardar la solicitud
            solicitud = SolicitudBNUP(
                tipo_recepcion=tipo_recepcion,
                numero_memo=numero_memo,
                correo_solicitante=correo_solicitante,
                depto_solicitante=depto_solicitante,
                nombre_solicitante=nombre_solicitante,
                numero_ingreso=numero_ingreso,
                fecha_ingreso=fecha_ingreso,
                funcionario_asignado=funcionario_asignado,
                descripcion=descripcion
            )
            solicitud.save()
            messages.success(request, 'Solicitud creada con éxito.')
            return redirect('home')
        except Exception as e:
            print("Error al guardar la solicitud:", e)  # Depuración
            messages.error(request, f'Error al guardar la solicitud: {e}')

    departamentos = Departamento.objects.all()
    funcionarios = Funcionario.objects.all()

    return render(request, 'bnup/form.html', {
        'departamentos': departamentos,
        'funcionarios': funcionarios
    })
