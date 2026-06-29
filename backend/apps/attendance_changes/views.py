from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsSupervisor
from apps.core.utils import success_response, error_response
from .services import attendance_change_service


class AttendanceChangeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(attendance_change_service.get_changes())

    def post(self, request):
        body = request.data
        employee_id = body.get('employee_id')
        attendance_date = body.get('attendance_date')
        requested_status = body.get('requested_status')
        if not employee_id or not attendance_date or not requested_status:
            return error_response(
                'employee_id, attendance_date, and requested_status are required', 400
            )
        if requested_status == 'Present' and (
            not body.get('requested_check_in') or not body.get('requested_check_out')
        ):
            return error_response(
                'Check-in and check-out times are required when marking Present', 400
            )
        try:
            data = attendance_change_service.create_change(body, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class AttendanceChangeDetailView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), IsSupervisor()]

    def patch(self, request, pk):
        status = request.data.get('status')
        if not status or status not in ['Approved', 'Rejected']:
            return error_response('Status must be Approved or Rejected', 400)
        try:
            data = attendance_change_service.approve_change(pk, status, request.user.id)
            return success_response(data)
        except ValueError as err:
            return error_response(str(err), 400)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = attendance_change_service.delete_change(pk, request.user.id)
        if not ok:
            return error_response('Request not found', 404)
        return success_response({'status': 'Deleted successfully'})
