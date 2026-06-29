from datetime import date as date_cls

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdminOrSupervisor
from apps.core.utils import success_response, error_response
from .services import attendance_service


def _today_str():
    return date_cls.today().strftime('%Y-%m-%d')


class AttendanceView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrSupervisor()]
        return [IsAuthenticated()]

    def get(self, request):
        date = request.query_params.get('date') or _today_str()
        department_id = request.query_params.get('department_id')
        department_id = int(department_id) if department_id else None
        data = attendance_service.get_attendance_by_date(date, department_id)
        return success_response(data)

    def post(self, request):
        body = request.data
        if not body.get('employeeId') or not body.get('attendanceDate') or not body.get('status'):
            return error_response(
                'employeeId, attendanceDate, and status are required', 400
            )
        try:
            data = attendance_service.update_attendance(body, request.user.id)
            return success_response(data)
        except Exception as err:
            return error_response(str(err), 400)


class AttendanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date') or _today_str()
        return success_response(attendance_service.get_summary(date))
