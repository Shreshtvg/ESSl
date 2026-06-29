from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.utils import success_response, error_response
from .services import report_service


class ReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params
        data = report_service.get_reports(
            start_date=q.get('startDate') or None,
            end_date=q.get('endDate') or None,
            department_id=q.get('departmentId'),
            branch=q.get('branch'),
        )
        return success_response(data)


class AttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params
        data = report_service.get_attendance_report(
            start_date=q.get('startDate') or None,
            end_date=q.get('endDate') or None,
            department_id=q.get('departmentId') or None,
        )
        return success_response(data)


class LeaveReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params
        data = report_service.get_leave_report(
            start_date=q.get('startDate') or None,
            end_date=q.get('endDate') or None,
            status=q.get('status') or None,
        )
        return success_response(data)


class DepartmentReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(report_service.get_department_report())


class VendorReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(report_service.get_vendor_report())


class MonthlyAttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params
        year = q.get('year')
        month = q.get('month')
        if not year or not month:
            return error_response('year and month are required', 400)
        data = report_service.get_monthly_attendance_report(
            year, month,
            branch=q.get('branch'),
            department_id=q.get('departmentId'),
            shift_id=q.get('shiftId'),
        )
        return success_response(data)
