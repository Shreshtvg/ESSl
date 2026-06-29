from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import shift_service


class ShiftListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(shift_service.get_shifts())

    def post(self, request):
        try:
            data = shift_service.create_shift(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class ShiftDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = shift_service.get_shift(pk)
        if not data:
            return error_response('Shift not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = shift_service.update_shift(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = shift_service.delete_shift(pk, request.user.id)
        if not ok:
            return error_response('Shift not found', 404)
        return success_response({'status': 'Deleted successfully'})
