from django.db import models

from apps.departments.models import Department
from apps.designations.models import Designation
from apps.shifts.models import Shift


class Employee(models.Model):
    STATUS_CHOICES = [('Active', 'Active'), ('Inactive', 'Inactive')]

    employee_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    designation = models.ForeignKey(Designation, null=True, blank=True, on_delete=models.SET_NULL)
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)
    branch = models.CharField(max_length=100, default='Main Branch')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    class Meta:
        db_table = 'employees'
        ordering = ['employee_code']

    def __str__(self):
        return f'{self.employee_code} - {self.name}'
