from django.urls import path

from .views import (
    ReportsView, AttendanceReportView, LeaveReportView,
    DepartmentReportView, VendorReportView, MonthlyAttendanceReportView,
)

urlpatterns = [
    path('reports', ReportsView.as_view()),
    path('reports/attendance', AttendanceReportView.as_view()),
    path('reports/leaves', LeaveReportView.as_view()),
    path('reports/departments', DepartmentReportView.as_view()),
    path('reports/vendors', VendorReportView.as_view()),
    path('reports/monthly-attendance', MonthlyAttendanceReportView.as_view()),
]
