from django.db import models

from apps.employees.models import Employee
from apps.shifts.models import Shift


class Roster(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    roster_date = models.DateField()
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = 'rosters'
        unique_together = ['employee', 'roster_date']
        ordering = ['roster_date']
