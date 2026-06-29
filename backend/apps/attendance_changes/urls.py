from django.urls import path

from .views import AttendanceChangeListView, AttendanceChangeDetailView

urlpatterns = [
    path('changes', AttendanceChangeListView.as_view()),
    path('changes/<int:pk>', AttendanceChangeDetailView.as_view()),
    path('attendance-changes', AttendanceChangeListView.as_view()),
    path('attendance-changes/<int:pk>', AttendanceChangeDetailView.as_view()),
]
