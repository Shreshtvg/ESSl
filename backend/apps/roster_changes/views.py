from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor, IsSupervisor
from apps.core.utils import success_response, error_response
from .services import roster_change_service


class RosterChangeListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(roster_change_service.get_requests())

    def post(self, request):
        body = request.data
        if not body.get('employee_id') or not body.get('roster_date') \
                or not body.get('requested_status'):
            return error_response(
                'employee_id, roster_date, and requested_status are required', 400
            )
        try:
            data = roster_change_service.create_request(
                {
                    'employee_id': body.get('employee_id'),
                    'roster_date': body.get('roster_date'),
                    'requested_status': body.get('requested_status'),
                },
                request.user.id,
            )
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class RosterChangeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSupervisor]

    def patch(self, request, pk):
        status = request.data.get('status')
        if not status or status not in ['Approved', 'Rejected']:
            return error_response('Status must be Approved or Rejected', 400)
        try:
            data = roster_change_service.review_request(pk, status, request.user.id)
            return success_response(data)
        except ValueError as err:
            return error_response(str(err), 400)
        except Exception as err:
            return error_response(str(err), 400)
