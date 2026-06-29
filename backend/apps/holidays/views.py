from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdmin
from apps.core.utils import success_response, error_response
from .services import holiday_service


class HolidayListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        return success_response(holiday_service.get_holidays())

    def post(self, request):
        if not request.data.get('holiday_date') or not request.data.get('name'):
            return error_response('holiday_date and name are required', 400)
        try:
            data = holiday_service.create_holiday(request.data, request.user.id)
            return success_response(data, status=201)
        except Exception as err:
            return error_response(str(err), 400)


class HolidayDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        data = holiday_service.get_holiday(pk)
        if not data:
            return error_response('Holiday not found', 404)
        return success_response(data)

    def put(self, request, pk):
        try:
            data = holiday_service.update_holiday(pk, request.data, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)

    def delete(self, request, pk):
        ok = holiday_service.delete_holiday(pk, request.user.id)
        if not ok:
            return error_response('Holiday not found', 404)
        return success_response({'status': 'Deleted successfully'})
