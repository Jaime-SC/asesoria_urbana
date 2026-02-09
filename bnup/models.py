# bnup/models.py
from django.db import models
from django.conf import settings
from django.db.models import Q

class Departamento(models.Model):
    nombre = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.nombre

class Funcionario(models.Model):
    nombre = models.CharField(max_length=255)
    # NUEVO: vínculo 1-1 con el usuario de Django
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='funcionario_bnup',
        unique=True,
        help_text="Usuario Django vinculado a este funcionario (fuente de email)."
    )

    def __str__(self):
        # Si hay user, muestralo; si no, deja el nombre legacy.
        return self.user.get_full_name() if self.user and self.user.get_full_name() else self.nombre

    @property
    def email(self):
        return self.user.email if (self.user and self.user.email) else None


class SeccionFuncionario(models.Model):
    """
    Grupo/sección de trabajo de funcionarios.

    Ejemplos:
      - 'Departamento de Asesoría Urbana'
      - 'Sección de Patrimonio'
      - 'Sección de Gestión Documental'
      - 'Sección de PRC'
      - 'Sección de Certificaciones'
    """
    nombre = models.CharField(max_length=255, unique=True)

    # Para el caso especial "Departamento de Asesoría Urbana":
    # si esto está en True, la sección incluye automáticamente *a todos*
    # los funcionarios, sin necesidad de mantener la M2M.
    incluye_todos = models.BooleanField(
        default=False,
        help_text="Si está activo, esta sección incluirá automáticamente a todos los funcionarios."
    )

    # Para el resto de secciones (Patrimonio, PRC, etc.) se usan los
    # funcionarios asociados aquí (cuando incluye_todos=False).
    funcionarios = models.ManyToManyField(
        Funcionario,
        related_name="secciones",
        blank=True,
        help_text="Sólo se utiliza cuando 'incluye_todos' está desactivado."
    )

    class Meta:
        verbose_name = "Sección de funcionarios"
        verbose_name_plural = "Secciones de funcionarios"

    def __str__(self):
        return self.nombre

    def get_funcionarios_queryset(self):
        """
        Devuelve un queryset de Funcionario para esta sección.

        - Si incluye_todos=True => todos los funcionarios de la BD.
        - Si incluye_todos=False => sólo los asociados explícitamente.
        """
        from .models import Funcionario as FuncModel  # para evitar import circular
        if self.incluye_todos:
            return FuncModel.objects.all()
        return self.funcionarios.all()

class TipoRecepcion(models.Model):
    tipo = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.tipo

class TipoSolicitud(models.Model):
    tipo = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.tipo


class IngresoSOLICITUD(models.Model):
    tipo_recepcion = models.ForeignKey(TipoRecepcion, on_delete=models.CASCADE)
    tipo_solicitud = models.ForeignKey(TipoSolicitud, on_delete=models.CASCADE)
    numero_memo = models.IntegerField(null=True, blank=True)
    correo_solicitante = models.EmailField(null=True, blank=True)
    depto_solicitante = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    numero_ingreso = models.IntegerField()
    fecha_ingreso_au = models.DateField()
    fecha_solicitud = models.DateField(null=True, blank=True)
    funcionarios_asignados = models.ManyToManyField(Funcionario, related_name='ingresos')
    descripcion = models.TextField(null=True, blank=True)
    archivo_adjunto_ingreso = models.FileField(
        upload_to='archivos_adjuntos/',
        null=True,
        blank=True
    )
    # Fecha límite manual para tipos Transparencia (5) y Transparencia Activa (16)
    fecha_maxima_respuesta = models.DateField(
        null=True,
        blank=True,
        help_text="Solo se usa cuando tipo de solicitud es Transparencia o Transparencia Activa."
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Solicitud {self.numero_ingreso} - {self.tipo_recepcion.tipo}"

    # ===================== SECCIONES COMPLETAS ===================== #
    def get_secciones_completas(self):
        """
        Devuelve una lista de objetos SeccionFuncionario tales que
        TODOS sus funcionarios pertenecen al conjunto de funcionarios
        asignados a esta solicitud.

        Regla:
          - Sea S una sección con funcionarios F(S).
          - Sea F(sol) el conjunto de funcionarios de la solicitud.
          - S se considera "completa" si F(S) ⊆ F(sol) y F(S) no es vacío.
          - Es válido que F(sol) tenga más funcionarios además de F(S).

        Nota:
          - Para secciones con incluye_todos=True, F(S) se considera como
            el conjunto de *todos* los funcionarios del sistema.
        """
        from .models import SeccionFuncionario, Funcionario  # evitar import circular en algunos contextos

        ids_sol = set(self.funcionarios_asignados.values_list("id", flat=True))
        if not ids_sol:
            return []

        # Prefetch de funcionarios por sección para evitar N+1 en secciones
        secciones = SeccionFuncionario.objects.all().prefetch_related("funcionarios")

        secciones_completas = []
        all_func_ids = None

        for sec in secciones:
            # Determinar el conjunto de funcionarios de la sección
            if sec.incluye_todos:
                if all_func_ids is None:
                    all_func_ids = set(
                        Funcionario.objects.values_list("id", flat=True)
                    )
                ids_sec = all_func_ids
            else:
                ids_sec = set(sec.funcionarios.values_list("id", flat=True))

            if not ids_sec:
                continue

            # La sección es "completa" si todos sus funcionarios están en la solicitud
            if ids_sec.issubset(ids_sol):
                secciones_completas.append(sec)

        return secciones_completas

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
    numero_egreso = models.IntegerField("Número de Egreso")
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
        constraints = [
            models.UniqueConstraint(
                fields=['numero_egreso'],
                condition=Q(is_active=True),
                name='uniq_numero_egreso_activo',
            ),
        ]

    def __str__(self):
        return f"Egreso {self.numero_egreso} — {self.fecha_egreso}"
