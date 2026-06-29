from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', default=None, read_only=True)
    timestamp = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'text', 'type', 'timestamp', 'user_id', 'user_name']
