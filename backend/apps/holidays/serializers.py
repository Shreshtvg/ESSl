from rest_framework import serializers

from .models import Holiday


class HolidaySerializer(serializers.ModelSerializer):
    holiday_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Holiday
        fields = ['id', 'holiday_date', 'name', 'description']
