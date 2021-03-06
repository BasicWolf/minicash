from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('minicash_core', '0009_asset_saldo_as_currency'),
    ]

    operations = [
        migrations.RenameField(
            model_name='asset',
            old_name='saldo',
            new_name='balance',
        ),
        migrations.RenameField(
            model_name='asset',
            old_name='saldo_currency',
            new_name='balance_currency',
        ),
    ]
