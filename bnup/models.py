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

class SolicitudBNUP(models.Model):
    tipo_recepcion = models.ForeignKey(TipoRecepcion, on_delete=models.CASCADE)
    numero_memo = models.IntegerField(null=True, blank=True)
    correo_solicitante = models.EmailField(null=True, blank=True)
    depto_solicitante = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    nombre_solicitante = models.CharField(max_length=255)
    numero_ingreso = models.IntegerField()
    fecha_ingreso = models.DateField()
    funcionario_asignado = models.ForeignKey(Funcionario, on_delete=models.CASCADE)
    descripcion = models.TextField(null=True, blank=True)
    archivo_adjunto_ingreso = models.FileField(upload_to='archivos_adjuntos/', null=True, blank=True)  # Ya existente
    
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.nombre_solicitante} - {self.tipo_recepcion.tipo}"
    
# models.py
class SalidaBNUP(models.Model):
    solicitud_bnup = models.ForeignKey('SolicitudBNUP', on_delete=models.CASCADE, related_name='salidas')
    numero_salida = models.IntegerField()
    fecha_salida = models.DateField()
    archivo_adjunto_salida = models.FileField(upload_to='archivos_adjuntos_salida/', null=True, blank=True)

    def __str__(self):
        return f"Salida Nº {self.numero_salida} - Solicitud Nº {self.solicitud_bnup.numero_ingreso}"
