from apps.activity_logs.services import log_activity
from apps.attendance.services import attendance_service
from apps.core.utils import calculate_hours
from .models import AttendanceChange
from .serializers import AttendanceChangeSerializer


class AttendanceChangeService:
    def get_changes(self):
        qs = (
            AttendanceChange.objects.select_related('employee', 'approved_by')
            .all()
            .order_by('-attendance_date')
        )
        return AttendanceChangeSerializer(qs, many=True).data

    def create_change(self, data, user_id):
        change = AttendanceChange.objects.create(
            employee_id=data.get('employee_id'),
            attendance_id=data.get('attendance_id'),
            attendance_date=data.get('attendance_date'),
            requested_check_in=data.get('requested_check_in'),
            requested_check_out=data.get('requested_check_out'),
            requested_status=data.get('requested_status') or 'Present',
            reason=data.get('reason'),
            status='Pending',
        )
        log_activity(
            f"Attendance correction request submitted for Employee ID "
            f"{data.get('employee_id')} date {data.get('attendance_date')}",
            'Info', user_id,
        )
        return AttendanceChangeSerializer(change).data

    def approve_change(self, change_id, status, user_id):
        try:
            change = AttendanceChange.objects.get(id=change_id)
        except AttendanceChange.DoesNotExist:
            raise ValueError('Correction request not found')

        change.status = status
        change.approved_by_id = user_id
        change.save()
        log_activity(
            f'Attendance correction #{change_id} was {status} by user #{user_id}', 'Info', user_id
        )

        if status == 'Approved':
            requested_status = change.requested_status or 'Present'
            is_present = requested_status == 'Present'
            hours = (
                calculate_hours(change.requested_check_in, change.requested_check_out)
                if is_present else 0
            )
            attendance_service.save_attendance(
                change.employee_id,
                change.attendance_date.strftime('%Y-%m-%d'),
                change.requested_check_in if is_present else None,
                change.requested_check_out if is_present else None,
                hours,
                requested_status,
            )
            log_activity(
                f'Attendance updated for employee ID {change.employee_id} on '
                f'{change.attendance_date} → {requested_status}',
                'Info', user_id,
            )

        return AttendanceChangeSerializer(change).data

    def delete_change(self, change_id, user_id):
        deleted, _ = AttendanceChange.objects.filter(id=change_id).delete()
        if deleted:
            log_activity(f'Correction request #{change_id} deleted', 'Info', user_id)
        return deleted > 0


attendance_change_service = AttendanceChangeService()
