from django.conf import settings
from django.db import models

from apps.employees.models import Employee


class RosterChangeRequest(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    roster_date = models.DateField()
    requested_status = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default='Pending')
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='roster_changes_requested',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='roster_changes_reviewed',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'roster_change_requests'
        ordering = ['-created_at']
