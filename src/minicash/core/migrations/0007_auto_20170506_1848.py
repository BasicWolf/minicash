from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('minicash_core', '0006_record_mode'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='subrecord',
            name='owner',
        ),
        migrations.RemoveField(
            model_name='subrecord',
            name='parent_record',
        ),
        migrations.RemoveField(
            model_name='subrecord',
            name='tags',
        ),
        migrations.AlterField(
            model_name='record',
            name='created_date',
            field=models.DateTimeField(db_index=True, verbose_name='Created'),
        ),
        migrations.DeleteModel(
            name='SubRecord',
        ),
    ]
