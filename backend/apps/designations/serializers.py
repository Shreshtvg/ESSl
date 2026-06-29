from rest_framework import serializers

from .models import Designation


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', default=None, read_only=True)

    class Meta:
        model = Designation
        fields = ['id', 'name', 'department_id', 'department_name']
