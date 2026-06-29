from rest_framework import serializers

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    attendance_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee_id', 'attendance_date', 'check_in', 'check_out', 'hours', 'status'
        ]
