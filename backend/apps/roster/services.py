from apps.activity_logs.services import log_activity
from .models import Roster
from .serializers import RosterSerializer


class RosterService:
    def get_roster(self, start_date=None, end_date=None):
        qs = Roster.objects.select_related('employee', 'shift').all()
        if start_date and end_date:
            qs = qs.filter(roster_date__range=[start_date, end_date])
        qs = qs.order_by('roster_date')
        return RosterSerializer(qs, many=True).data

    def assign_roster(self, data, user_id):
        employee_id = data.get('employee_id')
        roster_date = data.get('roster_date')
        shift_id = data.get('shift_id')
        Roster.objects.update_or_create(
            employee_id=employee_id,
            roster_date=roster_date,
            defaults={'shift_id': shift_id},
        )
        log_activity(
            f'Shift assigned via roster to employee ID {employee_id} for {roster_date}',
            'Info', user_id,
        )
        return {
            'employee_id': employee_id,
            'roster_date': roster_date,
            'shift_id': shift_id,
        }

    def remove_roster(self, employee_id, date, user_id):
        deleted, _ = Roster.objects.filter(
            employee_id=employee_id, roster_date=date
        ).delete()
        if deleted:
            log_activity(
                f'Roster entry removed for employee ID {employee_id} on {date}', 'Info', user_id
            )
        return deleted > 0


roster_service = RosterService()
