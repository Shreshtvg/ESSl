from django.conf import settings
from django.db import models

from apps.attendance.models import Attendance
from apps.employees.models import Employee


class AttendanceChange(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    attendance = models.ForeignKey(
        Attendance, null=True, blank=True, on_delete=models.SET_NULL
    )
    attendance_date = models.DateField()
    requested_check_in = models.CharField(max_length=10, blank=True, null=True)
    requested_check_out = models.CharField(max_length=10, blank=True, null=True)
    requested_status = models.CharField(max_length=20, default='Present')
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        db_table = 'attendance_changes'
        ordering = ['-attendance_date']
