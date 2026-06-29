from rest_framework import serializers

from .models import RosterChangeRequest


class RosterChangeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', default=None, read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', default=None, read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', default=None, read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', default=None, read_only=True)
    roster_date = serializers.DateField(format='%Y-%m-%d')
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = RosterChangeRequest
        fields = [
            'id', 'employee_id', 'roster_date', 'requested_status', 'status',
            'requested_by', 'reviewed_by', 'created_at',
            'employee_name', 'employee_code', 'requested_by_name', 'reviewed_by_name',
        ]
