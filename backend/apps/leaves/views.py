from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdmin, IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import leave_service


class LeaveListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(leave_service.get_leaves())

    def post(self, request):
        body = request.data
        if not body.get('employee_id') or not body.get('start_date') \
                or not body.get('end_date') or not body.get('leave_type'):
            return error_response(
                'employee_id, start_date, end_date, and leave_type are required', 400
            )
        try:
            data = leave_service.create_leave(body, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class LeaveDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsAdminOrSupervisor()]

    def patch(self, request, pk):
        try:
            if request.user.role == 'Supervisor':
                status = request.data.get('status')
                if not status or status not in ['Approved', 'Rejected', 'Pending']:
                    return error_response('Status must be Approved, Rejected, or Pending', 400)
                data = leave_service.approve_leave(pk, status, request.user.id)
                return success_response(data)
            else:
                leave_type = request.data.get('leave_type')
                start_date = request.data.get('start_date')
                end_date = request.data.get('end_date')
                reason = request.data.get('reason')
                if not leave_type or not start_date or not end_date:
                    return error_response('leave_type, start_date, and end_date are required', 400)
                data = leave_service.update_leave_details(
                    pk,
                    {'leave_type': leave_type, 'start_date': start_date,
                     'end_date': end_date, 'reason': reason},
                    request.user.id,
                )
                return success_response(data)
        except ValueError as err:
            return error_response(str(err), 400)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = leave_service.delete_leave(pk, request.user.id)
        if not ok:
            return error_response('Leave request not found', 404)
        return success_response({'status': 'Deleted successfully'})
