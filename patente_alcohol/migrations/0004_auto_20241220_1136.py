# Generated by Django 3.2.15 on 2024-12-20 14:36

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('patente_alcohol', '0003_auto_20241211_1150'),
    ]

    operations = [
        migrations.CreateModel(
            name='Sector',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='PatenteAlcohol',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_patente', models.CharField(max_length=50, unique=True)),
                ('unidad_vecinal', models.CharField(max_length=50)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('fecha_emision', models.DateField(auto_now_add=True)),
                ('revisado_por', models.CharField(blank=True, max_length=100, null=True)),
                ('archivo_adjunto', models.FileField(blank=True, null=True, upload_to='patente_alcohol/patentes_completadas/')),
                ('solicitud', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='patente', to='patente_alcohol.solicitudpatentealcohol')),
            ],
        ),
        migrations.AddField(
            model_name='ubicacion',
            name='sector',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='patente_alcohol.sector'),
        ),
    ]