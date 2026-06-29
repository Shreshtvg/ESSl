from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import employee_service


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


class EmployeeListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        q = request.query_params
        filters = {
            'search': q.get('search'),
            'department_id': _to_int(q.get('department_id')) if q.get('department_id') else None,
            'designation_id': _to_int(q.get('designation_id')) if q.get('designation_id') else None,
            'shift_id': _to_int(q.get('shift_id')) if q.get('shift_id') else None,
            'branch': q.get('branch'),
            'status': q.get('status'),
        }
        return success_response(employee_service.get_employees(filters))

    def post(self, request):
        try:
            data = employee_service.create_employee(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class EmployeeDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = employee_service.get_employee(pk)
        if not data:
            return error_response('Employee not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = employee_service.update_employee(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = employee_service.delete_employee(pk, request.user.id)
        if not ok:
            return error_response('Employee not found', 404)
        return success_response({'status': 'Deleted successfully'})
