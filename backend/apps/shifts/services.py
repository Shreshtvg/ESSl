from apps.activity_logs.services import log_activity
from .models import Shift
from .serializers import ShiftSerializer


class ShiftService:
    def get_shifts(self):
        qs = Shift.objects.all().order_by('name')
        return ShiftSerializer(qs, many=True).data

    def get_shift(self, shift_id):
        try:
            shift = Shift.objects.get(id=shift_id)
        except Shift.DoesNotExist:
            return None
        return ShiftSerializer(shift).data

    def create_shift(self, data, user_id):
        shift = Shift.objects.create(
            name=data.get('name'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
        )
        log_activity(
            f"Shift '{shift.name}' ({shift.start_time}-{shift.end_time}) was created",
            'Info', user_id,
        )
        return ShiftSerializer(shift).data

    def update_shift(self, shift_id, data, user_id):
        shift = Shift.objects.get(id=shift_id)
        shift.name = data.get('name')
        shift.start_time = data.get('start_time')
        shift.end_time = data.get('end_time')
        shift.save()
        log_activity(
            f"Shift '{shift.name}' was updated to {shift.start_time}-{shift.end_time}",
            'Info', user_id,
        )
        return ShiftSerializer(shift).data

    def delete_shift(self, shift_id, user_id):
        try:
            shift = Shift.objects.get(id=shift_id)
        except Shift.DoesNotExist:
            return False
        name = shift.name
        shift.delete()
        log_activity(f"Shift '{name}' was deleted", 'Info', user_id)
        return True


shift_service = ShiftService()
