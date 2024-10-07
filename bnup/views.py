from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from .models import SolicitudBNUP, Departamento, Funcionario, TipoRecepcion
from django.contrib import messages
from django.db.models import Count
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse
import json

def bnup_form(request):
    if request.method == 'POST':
        # Verifica si es una actualización de salida
        if 'numero_salida' in request.POST and 'archivo_adjunto_salida' in request.FILES:
            solicitud_id = request.POST.get('solicitud_id')
            numero_salida = request.POST.get('numero_salida')
            archivo_adjunto_salida = request.FILES.get('archivo_adjunto_salida')
            
            solicitud = SolicitudBNUP.objects.get(id=solicitud_id)
            solicitud.numero_salida = numero_salida
            solicitud.archivo_adjunto_salida = archivo_adjunto_salida
            solicitud.fecha_salida = datetime.now().date()  # Establecer la fecha actual como la fecha de salida
            solicitud.save()            
            request.session['redirect_to_bnup'] = True
            return redirect('home')

        # Extraer datos del formulario para crear una nueva solicitud
        tipo_recepcion_id = request.POST.get('tipo_recepcion')
        numero_memo = request.POST.get('num_memo') if tipo_recepcion_id != '2' else None
        correo_solicitante = request.POST.get('correo_solicitante') if tipo_recepcion_id == '2' else None
        depto_solicitante_id = request.POST.get('depto_solicitante')
        nombre_solicitante = request.POST.get('nombre_solicitante')
        numero_ingreso = request.POST.get('numero_ingreso')
        fecha_ingreso = request.POST.get('fecha_ingreso')
        funcionario_asignado_id = request.POST.get('funcionario_asignado')
        descripcion = request.POST.get('descripcion')
        archivo_adjunto = request.FILES.get('archivo_adjunto_ingreso')

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
                descripcion=descripcion,
                archivo_adjunto_ingreso=archivo_adjunto
            )
            solicitud.save()            
            request.session['redirect_to_bnup'] = True
            return redirect('home')
        except Exception as e:
            print("Error al guardar la solicitud:", e)
            messages.error(request, f'Error al guardar la solicitud: {e}')
            request.session['redirect_to_bnup'] = True
            return redirect('home')

    # Obtener todas las solicitudes activas
    solicitudes = SolicitudBNUP.objects.filter(is_active=True)

    departamentos = Departamento.objects.all()
    funcionarios = Funcionario.objects.all()
    tipos_recepcion = TipoRecepcion.objects.all()

    return render(request, 'bnup/form.html', {
        'departamentos': departamentos,
        'funcionarios': funcionarios,
        'solicitudes': solicitudes.select_related('tipo_recepcion'),
        'tipos_recepcion': tipos_recepcion
    })

def edit_bnup_record(request):
    if request.method == 'POST':
        solicitud_id = request.POST.get('solicitud_id')
        solicitud = get_object_or_404(SolicitudBNUP, id=solicitud_id)

        # Obtener datos del formulario
        tipo_recepcion_id = request.POST.get('tipo_recepcion')
        numero_memo = request.POST.get('num_memo') if tipo_recepcion_id != '2' else None
        correo_solicitante = request.POST.get('correo_solicitante') if tipo_recepcion_id == '2' else None
        depto_solicitante_id = request.POST.get('depto_solicitante')
        nombre_solicitante = request.POST.get('nombre_solicitante')
        numero_ingreso = request.POST.get('numero_ingreso')
        fecha_ingreso = request.POST.get('fecha_ingreso')
        descripcion = request.POST.get('descripcion')
        archivo_adjunto = request.FILES.get('archivo_adjunto_ingreso')

        # No obtener 'funcionario_asignado_id' ya que no se puede editar

        try:
            tipo_recepcion = TipoRecepcion.objects.get(id=tipo_recepcion_id)
            depto_solicitante = Departamento.objects.get(id=depto_solicitante_id)
            # No necesitamos obtener 'funcionario_asignado'

            # Actualizar los campos de la solicitud
            solicitud.tipo_recepcion = tipo_recepcion
            solicitud.numero_memo = numero_memo
            solicitud.correo_solicitante = correo_solicitante
            solicitud.depto_solicitante = depto_solicitante
            solicitud.nombre_solicitante = nombre_solicitante
            solicitud.numero_ingreso = numero_ingreso
            solicitud.fecha_ingreso = fecha_ingreso
            # No actualizar 'funcionario_asignado'
            solicitud.descripcion = descripcion
            if archivo_adjunto:
                solicitud.archivo_adjunto_ingreso = archivo_adjunto

            solicitud.save()
            messages.success(request, 'Solicitud actualizada correctamente.')
            request.session['redirect_to_bnup'] = True
            return JsonResponse({'success': True, 'data': {'id': solicitud.id}})
        except Exception as e:
            print("Error al actualizar la solicitud:", e)
            return JsonResponse({'success': False, 'error': str(e)})
    else:
        # Manejar la solicitud GET para obtener los datos de la solicitud
        solicitud_id = request.GET.get('solicitud_id')
        solicitud = get_object_or_404(SolicitudBNUP, id=solicitud_id)
        data = {
            'id': solicitud.id,
            'tipo_recepcion': solicitud.tipo_recepcion.id,
            'numero_memo': solicitud.numero_memo,
            'correo_solicitante': solicitud.correo_solicitante,
            'depto_solicitante': solicitud.depto_solicitante.id,
            'nombre_solicitante': solicitud.nombre_solicitante,
            'numero_ingreso': solicitud.numero_ingreso,
            'fecha_ingreso': solicitud.fecha_ingreso.strftime('%Y-%m-%d'),
            'funcionario_asignado': solicitud.funcionario_asignado.id,
            'descripcion': solicitud.descripcion,
            # Puedes incluir más campos si es necesario
        }
        return JsonResponse({'success': True, 'data': data})



def delete_bnup_records(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ids = data.get('ids', [])
            # Realizar el borrado lógico
            SolicitudBNUP.objects.filter(id__in=ids).update(is_active=False)
            return JsonResponse({'success': True})
        except Exception as e:
            print("Error al eliminar los registros:", e)
            return JsonResponse({'success': False})
    else:
        return JsonResponse({'success': False})

def statistics_view(request):
    # Lógica para calcular estadísticas basadas en los datos

    solicitudes_por_depto = SolicitudBNUP.objects.values('depto_solicitante__nombre').annotate(total=Count('id'))
    solicitudes_por_funcionario = SolicitudBNUP.objects.values('funcionario_asignado__nombre').annotate(total=Count('id'))    
    solicitudes_por_tipo = SolicitudBNUP.objects.values('tipo_recepcion__tipo').annotate(total=Count('id'))    
    solicitudes_por_anio = SolicitudBNUP.objects.extra(select={'anio': "EXTRACT(YEAR FROM fecha_ingreso)"}).values('anio').annotate(total=Count('id'))

    # Nueva estadística: Solicitudes por mes
    solicitudes_por_mes = SolicitudBNUP.objects.extra(select={'mes': "EXTRACT(MONTH FROM fecha_ingreso)"}).values('mes').annotate(total=Count('id'))

    # Nueva estadística 1
    solicitudes_por_dia_semana = SolicitudBNUP.objects.extra(select={'dia_semana': "EXTRACT(DOW FROM fecha_ingreso)"}).values('dia_semana').annotate(total=Count('id'))

    context = {        
        'solicitudes_por_depto': json.dumps({item['depto_solicitante__nombre']: item['total'] for item in solicitudes_por_depto}, cls=DjangoJSONEncoder),
        'solicitudes_por_funcionario': json.dumps({item['funcionario_asignado__nombre']: item['total'] for item in solicitudes_por_funcionario}, cls=DjangoJSONEncoder),        
        'solicitudes_por_tipo': json.dumps({item['tipo_recepcion__tipo']: item['total'] for item in solicitudes_por_tipo}, cls=DjangoJSONEncoder),
        'solicitudes_por_anio': json.dumps({str(int(item['anio'])): item['total'] for item in solicitudes_por_anio}, cls=DjangoJSONEncoder),
        'solicitudes_por_mes': json.dumps({str(int(item['mes'])): item['total'] for item in solicitudes_por_mes}, cls=DjangoJSONEncoder),
        'solicitudes_por_dia_semana': json.dumps({str(int(item['dia_semana'])): item['total'] for item in solicitudes_por_dia_semana}, cls=DjangoJSONEncoder),
    }
    return render(request, 'bnup/statistics.html', context)
