from rest_framework import serializers

from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', default=None, read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', default=None, read_only=True)
    approver_name = serializers.CharField(source='approved_by.name', default=None, read_only=True)
    start_date = serializers.DateField(format='%Y-%m-%d')
    end_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee_id', 'start_date', 'end_date', 'leave_type', 'reason',
            'status', 'approved_by', 'employee_name', 'employee_code', 'approver_name',
        ]
