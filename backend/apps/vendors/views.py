from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import vendor_service


class VendorListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(vendor_service.get_vendors())

    def post(self, request):
        if not request.data.get('name'):
            return error_response('Vendor name is required', 400)
        try:
            data = vendor_service.create_vendor(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class VendorDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = vendor_service.get_vendor(pk)
        if not data:
            return error_response('Vendor not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = vendor_service.update_vendor(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = vendor_service.delete_vendor(pk, request.user.id)
        if not ok:
            return error_response('Vendor not found', 404)
        return success_response({'status': 'Deleted successfully'})
