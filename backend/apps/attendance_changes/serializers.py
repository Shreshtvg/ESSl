from rest_framework import serializers

from .models import AttendanceChange


class AttendanceChangeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', default=None, read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', default=None, read_only=True)
    approver_name = serializers.CharField(source='approved_by.name', default=None, read_only=True)
    attendance_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = AttendanceChange
        fields = [
            'id', 'employee_id', 'attendance_id', 'attendance_date',
            'requested_check_in', 'requested_check_out', 'requested_status',
            'reason', 'status', 'approved_by', 'employee_name', 'employee_code', 'approver_name',
        ]
