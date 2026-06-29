from django.db import models

from apps.departments.models import Department


class Designation(models.Model):
    name = models.CharField(max_length=200)
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        db_table = 'designations'
        ordering = ['name']

    def __str__(self):
        return self.name
