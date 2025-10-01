from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('bnup', '0021_funcionario_user'),
    ]
    operations = [
        UnaccentExtension(),
    ]
