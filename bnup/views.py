from django.shortcuts import render, redirect
from .models import SolicitudBNUP, Departamento, Funcionario, TipoRecepcion
from django.contrib import messages
from django.db.models import Count, Avg
from django.core.serializers.json import DjangoJSONEncoder
import json

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
            request.session['redirect_to_bnup'] = True  # Set a session flag
            return redirect('home')
        except Exception as e:
            print("Error al guardar la solicitud:", e)  # Depuración
            messages.error(request, f'Error al guardar la solicitud: {e}')

    # Obtener las solicitudes por Memo y Correo
    solicitudes_memo = SolicitudBNUP.objects.filter(tipo_recepcion__tipo='Memo')
    solicitudes_correo = SolicitudBNUP.objects.filter(tipo_recepcion__tipo='Correo')

    departamentos = Departamento.objects.all()
    funcionarios = Funcionario.objects.all()

    return render(request, 'bnup/form.html', {
        'departamentos': departamentos,
        'funcionarios': funcionarios,
        'solicitudes_memo': solicitudes_memo,
        'solicitudes_correo': solicitudes_correo
    })

def statistics_view(request):
    # Cálculo de estadísticas basadas en los datos
    solicitudes_por_depto = SolicitudBNUP.objects.values('depto_solicitante__nombre').annotate(total=Count('id'))
    solicitudes_por_funcionario = SolicitudBNUP.objects.values('funcionario_asignado__nombre').annotate(total=Count('id'))
    solicitudes_por_fecha = SolicitudBNUP.objects.extra(select={'fecha': 'DATE(fecha_ingreso)'}).values('fecha').annotate(total=Count('id'))
    solicitudes_por_tipo = SolicitudBNUP.objects.values('tipo_recepcion__tipo').annotate(total=Count('id'))
    promedio_por_depto = SolicitudBNUP.objects.values('depto_solicitante__nombre').annotate(promedio=Avg('numero_ingreso'))

    context = {        
        'solicitudes_por_depto': json.dumps({item['depto_solicitante__nombre']: item['total'] for item in solicitudes_por_depto}, cls=DjangoJSONEncoder),
        'solicitudes_por_funcionario': json.dumps({item['funcionario_asignado__nombre']: item['total'] for item in solicitudes_por_funcionario}, cls=DjangoJSONEncoder),
        'solicitudes_por_fecha': json.dumps({item['fecha'].strftime('%Y-%m-%d'): item['total'] for item in solicitudes_por_fecha}, cls=DjangoJSONEncoder),
        'solicitudes_por_tipo': json.dumps({item['tipo_recepcion__tipo']: item['total'] for item in solicitudes_por_tipo}, cls=DjangoJSONEncoder),
        'promedio_por_depto': json.dumps({item['depto_solicitante__nombre']: round(item['promedio'], 2) for item in promedio_por_depto}, cls=DjangoJSONEncoder),
    }
    return render(request, 'bnup/statistics.html', context)