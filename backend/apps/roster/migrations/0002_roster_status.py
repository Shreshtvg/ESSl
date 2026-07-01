from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('roster', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='roster',
            name='status',
            field=models.CharField(
                choices=[('W', 'Working'), ('WO', 'Week Off'), ('CO', 'Comp Off')],
                default='W',
                max_length=5,
            ),
        ),
    ]
