from django.db import models

from apps.employees.models import Employee
from apps.shifts.models import Shift


class Roster(models.Model):
    STATUS_CHOICES = [('W', 'Working'), ('WO', 'Week Off'), ('CO', 'Comp Off')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    roster_date = models.DateField()
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=5, choices=STATUS_CHOICES, default='W')

    class Meta:
        db_table = 'rosters'
        unique_together = ['employee', 'roster_date']
        ordering = ['roster_date']
