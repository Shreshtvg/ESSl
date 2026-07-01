from rest_framework import serializers

from .models import Roster


class RosterSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', default=None, read_only=True)
    employee_code = serializers.CharField(source='employee.employee_code', default=None, read_only=True)
    shift_name = serializers.CharField(source='shift.name', default=None, read_only=True)
    roster_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Roster
        fields = [
            'id', 'employee_id', 'roster_date', 'shift_id', 'status',
            'employee_name', 'employee_code', 'shift_name',
        ]
