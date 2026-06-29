from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import designation_service


class DesignationListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(designation_service.get_designations())

    def post(self, request):
        try:
            data = designation_service.create_designation(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class DesignationDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = designation_service.get_designation(pk)
        if not data:
            return error_response('Designation not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = designation_service.update_designation(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = designation_service.delete_designation(pk, request.user.id)
        if not ok:
            return error_response('Designation not found', 404)
        return success_response({'status': 'Deleted successfully'})
