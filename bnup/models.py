# bnup/models.py
from django.db import models

class Departamento(models.Model):
    nombre = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.nombre

class Funcionario(models.Model):
    nombre = models.CharField(max_length=255)

    def __str__(self):
        return self.nombre

class TipoRecepcion(models.Model):
    tipo = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.tipo

class TipoSolicitud(models.Model):
    tipo = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.tipo


class IngresoSOLICITUD(models.Model):  # Renombrado de SolicitudBNUP
    tipo_recepcion = models.ForeignKey(TipoRecepcion, on_delete=models.CASCADE)
    tipo_solicitud = models.ForeignKey(TipoSolicitud, on_delete=models.CASCADE)
    numero_memo = models.IntegerField(null=True, blank=True)
    correo_solicitante = models.EmailField(null=True, blank=True)
    depto_solicitante = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    numero_ingreso = models.IntegerField()
    fecha_ingreso_au = models.DateField()  # Renombrado
    fecha_solicitud = models.DateField(null=True, blank=True)
    funcionarios_asignados = models.ManyToManyField(Funcionario, related_name='ingresos')
    descripcion = models.TextField(null=True, blank=True)
    archivo_adjunto_ingreso = models.FileField(upload_to='archivos_adjuntos/', null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        # return f"{self.nombre_solicitante} - {self.tipo_recepcion.tipo}"  # Línea eliminada
        return f"Solicitud {self.numero_ingreso} - {self.tipo_recepcion.tipo}"

class SalidaSOLICITUD(models.Model):
    ingreso_solicitud = models.ForeignKey(
        'IngresoSOLICITUD',
        on_delete=models.CASCADE,
        related_name='salidas'
    )
    numero_salida = models.IntegerField()
    fecha_salida = models.DateField()
    archivo_adjunto_salida = models.FileField(
        upload_to='archivos_adjuntos_salida/',
        null=True,
        blank=True
    )
    # Nuevo campo: funcionarios que realizaron la salida (podrán ser varios)
    funcionarios = models.ManyToManyField(Funcionario, related_name='salidas', blank=True)
    # Nuevo campo: descripción opcional (observaciones, links, etc.)
    descripcion = models.TextField(null=True, blank=True)
    # Nuevo campo para borrado lógico
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Salida Nº {self.numero_salida} - Solicitud Nº {self.ingreso_solicitud.numero_ingreso}"

class EgresoAU(models.Model):
    numero_egreso = models.IntegerField("Número de Egreso", unique=True)
    fecha_egreso = models.DateField("Fecha de Egreso")
    descripcion = models.TextField("Descripción", blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Cambiamos de ForeignKey a ManyToManyField
    funcionarios = models.ManyToManyField(
        Funcionario,
        related_name='egresos_au',
        verbose_name="Funcionarios responsables"
    )

    destinatario = models.ForeignKey(
        'Departamento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='egresos_recibidos',
        verbose_name="Destinatario"
    )
    archivo_adjunto = models.FileField(
        "Archivo Adjunto",
        upload_to='egresos_adjuntos/',
        blank=True,
        null=True
    )

    # NUEVO: archivo de respuesta
    archivo_respuesta = models.FileField(
        "Archivo Respuesta",
        upload_to='egresos_respuestas/',
        blank=True,
        null=True
    )
    
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-numero_egreso']
        verbose_name = "Egreso AU"
        verbose_name_plural = "Egresos AU"

    def __str__(self):
        return f"Egreso {self.numero_egreso} — {self.fecha_egreso}"
