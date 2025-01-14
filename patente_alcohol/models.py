from django.db import models


class Solicitante(models.Model):
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    correo = models.EmailField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nombre


class Cerro(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre


class Sector(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre


class SolicitudPatenteAlcohol(models.Model):
    solicitante = models.ForeignKey(Solicitante, on_delete=models.CASCADE)
    rol_avaluo = models.CharField(max_length=20)
    fecha_ingreso = models.DateField(auto_now_add=True)
    numero_ingreso = models.CharField(max_length=20, blank=True, null=True)
    archivo_adjunto = models.FileField(
        upload_to="patente_alcohol/ingresos/", blank=True, null=True
    )

    def __str__(self):
        return f"Solicitud {self.id} - {self.rol_avaluo}"


class Ubicacion(models.Model):
    calle = models.CharField(max_length=100)
    numero = models.CharField(max_length=10, blank=True, null=True)
    departamento = models.CharField(max_length=10, blank=True, null=True)
    cerro = models.ForeignKey(Cerro, on_delete=models.SET_NULL, null=True, blank=True)
    sector = models.ForeignKey(Sector, on_delete=models.SET_NULL, null=True, blank=True)
    solicitud = models.OneToOneField(
        "SolicitudPatenteAlcohol",  # Referencia como string para evitar el ciclo
        on_delete=models.CASCADE,
        related_name="ubicacion",
        null=True,
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.calle} {self.numero}, {self.sector.nombre if self.sector else ''}"
        )


class Salida(models.Model):
    solicitud = models.OneToOneField(
        "SolicitudPatenteAlcohol",  # Referencia como string para evitar el ciclo
        on_delete=models.CASCADE,
        related_name="salida",
    )
    numero_salida = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField()
    archivo_adjunto_salida = models.FileField(
        upload_to="salidas_adjuntos/", null=True, blank=True
    )
    fecha_salida = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Salida {self.numero_salida} para Solicitud {self.solicitud.id}"


class PatenteAlcohol(models.Model):
    numero_patente = models.CharField(max_length=50, unique=True)
    solicitud = models.OneToOneField(
        "SolicitudPatenteAlcohol",  # Referencia como string para evitar el ciclo
        on_delete=models.CASCADE,
        related_name="patente",
    )
    unidad_vecinal = models.CharField(max_length=50)
    observaciones = models.TextField(blank=True, null=True)
    fecha_emision = models.DateField(auto_now_add=True)
    revisado_por = models.CharField(max_length=100, blank=True, null=True)
    archivo_adjunto = models.FileField(
        upload_to="patente_alcohol/patentes_completadas/", blank=True, null=True
    )

    def __str__(self):
        return f"Patente {self.numero_patente} - Solicitud {self.solicitud.id}"
