from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    text = models.TextField()
    type = models.CharField(max_length=20, default='Info')  # Info, Auth, System
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']
