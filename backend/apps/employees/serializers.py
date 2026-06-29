from rest_framework import serializers

from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', default=None, read_only=True)
    designation_name = serializers.CharField(source='designation.name', default=None, read_only=True)
    shift_name = serializers.CharField(source='shift.name', default=None, read_only=True)
    shift_start = serializers.CharField(source='shift.start_time', default=None, read_only=True)
    shift_end = serializers.CharField(source='shift.end_time', default=None, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_code', 'name', 'email', 'phone',
            'department_id', 'designation_id', 'shift_id', 'branch', 'status',
            'department_name', 'designation_name', 'shift_name', 'shift_start', 'shift_end',
        ]
