from apps.roster.models import Roster
from .models import RosterChangeRequest
from .serializers import RosterChangeRequestSerializer


class RosterChangeService:
    def get_requests(self):
        qs = (
            RosterChangeRequest.objects.select_related(
                'employee', 'requested_by', 'reviewed_by'
            )
            .all()
            .order_by('-created_at')
        )
        return RosterChangeRequestSerializer(qs, many=True).data

    def create_request(self, data, user_id):
        employee_id = data.get('employee_id')
        roster_date = data.get('roster_date')
        requested_status = data.get('requested_status')

        existing = RosterChangeRequest.objects.filter(
            employee_id=employee_id, roster_date=roster_date, status='Pending'
        ).first()
        if existing:
            existing.requested_status = requested_status
            existing.save()
            return RosterChangeRequestSerializer(existing).data

        req = RosterChangeRequest.objects.create(
            employee_id=employee_id,
            roster_date=roster_date,
            requested_status=requested_status,
            requested_by_id=user_id,
        )
        return RosterChangeRequestSerializer(req).data

    def review_request(self, request_id, status, user_id):
        try:
            req = RosterChangeRequest.objects.select_related('employee').get(id=request_id)
        except RosterChangeRequest.DoesNotExist:
            raise ValueError('Roster change request not found')

        req.status = status
        req.reviewed_by_id = user_id
        req.save()

        if status == 'Approved':
            # Persist the requested day-type (W / WO / CO) on the roster cell.
            # Working days keep the employee's own default shift; off-days have none.
            requested = req.requested_status
            shift_id = req.employee.shift_id if requested == 'W' else None
            Roster.objects.update_or_create(
                employee_id=req.employee_id,
                roster_date=req.roster_date,
                defaults={'status': requested, 'shift_id': shift_id},
            )

        return RosterChangeRequestSerializer(req).data


roster_change_service = RosterChangeService()
