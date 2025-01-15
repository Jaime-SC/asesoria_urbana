# bnup/migrations/0009_rename_models_and_fields.py

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('bnup', '0008_auto_20250113_1614'),  # Asegúrate de que esta dependencia sea correcta
    ]

    operations = [
        migrations.RenameModel(
            old_name='SolicitudBNUP',
            new_name='IngresoSOLICITUD',
        ),
        migrations.RenameModel(
            old_name='SalidaBNUP',
            new_name='SalidaSOLICITUD',
        ),
        migrations.RenameField(
            model_name='ingresosolicitud',  # Nombre en minúsculas
            old_name='fecha_ingreso',
            new_name='fecha_ingreso_au',
        ),
        migrations.RenameField(
            model_name='ingresosolicitud',
            old_name='fecha_egreso',
            new_name='fecha_salida_solicitante',
        ),
    ]
