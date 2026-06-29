from .models import ActivityLog
from .serializers import ActivityLogSerializer


def log_activity(text, log_type='Info', user_id=None):
    ActivityLog.objects.create(text=text, type=log_type, user_id=user_id)


class ActivityLogService:
    def get_logs(self):
        qs = ActivityLog.objects.all().order_by('-timestamp')[:100]
        return ActivityLogSerializer(qs, many=True).data


activity_log_service = ActivityLogService()
