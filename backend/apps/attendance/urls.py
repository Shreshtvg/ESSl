from django.urls import path

from .views import AttendanceView, AttendanceSummaryView

urlpatterns = [
    path('attendance', AttendanceView.as_view()),
    path('attendance/summary', AttendanceSummaryView.as_view()),
]
