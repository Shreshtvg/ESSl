from datetime import timedelta

from apps.activity_logs.services import log_activity
from apps.attendance.services import attendance_service
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer


class LeaveService:
    def get_leaves(self):
        qs = (
            LeaveRequest.objects.select_related('employee', 'approved_by')
            .all()
            .order_by('-start_date')
        )
        return LeaveRequestSerializer(qs, many=True).data

    def create_leave(self, data, user_id):
        leave = LeaveRequest.objects.create(
            employee_id=data.get('employee_id'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            leave_type=data.get('leave_type'),
            reason=data.get('reason'),
            status=data.get('status') or 'Pending',
        )
        log_activity(
            f"Leave request submitted for Employee ID {data.get('employee_id')} "
            f"({data.get('start_date')} to {data.get('end_date')})",
            'Info', user_id,
        )
        return LeaveRequestSerializer(leave).data

    def update_leave_details(self, leave_id, details, user_id):
        try:
            leave = LeaveRequest.objects.get(id=leave_id)
        except LeaveRequest.DoesNotExist:
            raise ValueError('Leave request not found')
        leave.leave_type = details.get('leave_type')
        leave.start_date = details.get('start_date')
        leave.end_date = details.get('end_date')
        leave.reason = details.get('reason')
        leave.save()
        log_activity(f'Leave request #{leave_id} details updated by user #{user_id}', 'Info', user_id)
        return LeaveRequestSerializer(leave).data

    def approve_leave(self, leave_id, status, user_id):
        try:
            leave = LeaveRequest.objects.get(id=leave_id)
        except LeaveRequest.DoesNotExist:
            raise ValueError('Leave request not found')

        leave.status = status
        leave.approved_by_id = user_id
        leave.save()
        log_activity(f'Leave request #{leave_id} was {status} by user #{user_id}', 'Info', user_id)

        if status == 'Approved':
            day = leave.start_date
            while day <= leave.end_date:
                try:
                    attendance_service.save_attendance(
                        leave.employee_id, day.strftime('%Y-%m-%d'), None, None, 0, 'Leave'
                    )
                except Exception as err:  # pragma: no cover
                    print(f'Failed to auto-insert attendance leave for {day}: {err}')
                day = day + timedelta(days=1)

        return LeaveRequestSerializer(leave).data

    def delete_leave(self, leave_id, user_id):
        deleted, _ = LeaveRequest.objects.filter(id=leave_id).delete()
        if deleted:
            log_activity(f'Leave request #{leave_id} deleted', 'Info', user_id)
        return deleted > 0


leave_service = LeaveService()
