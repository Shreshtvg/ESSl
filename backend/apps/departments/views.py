from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import department_service


class DepartmentListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(department_service.get_departments())

    def post(self, request):
        try:
            data = department_service.create_department(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class DepartmentDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = department_service.get_department(pk)
        if not data:
            return error_response('Department not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = department_service.update_department(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = department_service.delete_department(pk, request.user.id)
        if not ok:
            return error_response("Department not found or couldn't be deleted", 404)
        return success_response({'status': 'Deleted successfully'})
