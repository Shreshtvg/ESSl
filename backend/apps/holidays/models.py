from django.db import models


class Holiday(models.Model):
    holiday_date = models.DateField(unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'holidays'
        ordering = ['holiday_date']

    def __str__(self):
        return f'{self.holiday_date} - {self.name}'
