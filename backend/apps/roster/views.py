from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import roster_service


class RosterListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')
        return success_response(roster_service.get_roster(start_date, end_date))

    def post(self, request):
        body = request.data
        if not body.get('employee_id') or not body.get('roster_date') or not body.get('shift_id'):
            return error_response('employee_id, roster_date, and shift_id are required', 400)
        try:
            data = roster_service.assign_roster(body, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)


class RosterDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def delete(self, request, employee_id, date):
        roster_service.remove_roster(employee_id, date, request.user.id)
        return success_response({'status': 'Removed successfully'})
