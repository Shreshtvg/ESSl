from apps.activity_logs.services import log_activity
from .models import Holiday
from .serializers import HolidaySerializer


class HolidayService:
    def get_holidays(self):
        qs = Holiday.objects.all().order_by('holiday_date')
        return HolidaySerializer(qs, many=True).data

    def get_holiday(self, holiday_id):
        try:
            holiday = Holiday.objects.get(id=holiday_id)
        except Holiday.DoesNotExist:
            return None
        return HolidaySerializer(holiday).data

    def create_holiday(self, data, user_id):
        holiday = Holiday.objects.create(
            holiday_date=data.get('holiday_date'),
            name=data.get('name'),
            description=data.get('description'),
        )
        log_activity(
            f"Holiday '{holiday.name}' on {holiday.holiday_date} declared", 'Info', user_id
        )
        return HolidaySerializer(holiday).data

    def update_holiday(self, holiday_id, data, user_id):
        holiday = Holiday.objects.get(id=holiday_id)
        holiday.holiday_date = data.get('holiday_date')
        holiday.name = data.get('name')
        holiday.description = data.get('description')
        holiday.save()
        log_activity(
            f"Holiday '{holiday.name}' renamed / moved to {holiday.holiday_date}", 'Info', user_id
        )
        return HolidaySerializer(holiday).data

    def delete_holiday(self, holiday_id, user_id):
        try:
            holiday = Holiday.objects.get(id=holiday_id)
        except Holiday.DoesNotExist:
            return False
        name, hdate = holiday.name, holiday.holiday_date
        holiday.delete()
        log_activity(f"Holiday '{name}' on {hdate} deleted", 'Info', user_id)
        return True


holiday_service = HolidayService()
