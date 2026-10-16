from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('places', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='touristplace',
            name='fogg_motivation_short',
            field=models.CharField(
                verbose_name='Motivación breve para la tarjeta Fogg',
                max_length=140,
                blank=True,
                default='',
                help_text='Beneficio del destino en hasta 140 caracteres. Si está vacío, se genera un mensaje con el distrito.',
            ),
        ),
    ]
