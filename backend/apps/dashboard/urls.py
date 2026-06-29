from django.urls import path

from .views import DashboardStatsView, NotificationsView

urlpatterns = [
    path('dashboard/stats', DashboardStatsView.as_view()),
    path('notifications', NotificationsView.as_view()),
]
