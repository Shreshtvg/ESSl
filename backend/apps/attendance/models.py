from django.db import models

from apps.employees.models import Employee


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'), ('Absent', 'Absent'), ('Leave', 'Leave'),
        ('Holiday', 'Holiday'), ('Week Off', 'Week Off'), ('Comp Off', 'Comp Off'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    attendance_date = models.DateField()
    check_in = models.CharField(max_length=10, blank=True, null=True)
    check_out = models.CharField(max_length=10, blank=True, null=True)
    hours = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    class Meta:
        db_table = 'attendance'
        unique_together = ['employee', 'attendance_date']

    def __str__(self):
        return f'{self.employee_id} @ {self.attendance_date} = {self.status}'
