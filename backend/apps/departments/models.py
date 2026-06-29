from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    fixed_week_off = models.CharField(max_length=20, default='Sunday')

    class Meta:
        db_table = 'departments'
        ordering = ['name']

    def __str__(self):
        return self.name
