from django.urls import path

from .views import LeaveListView, LeaveDetailView

urlpatterns = [
    path('leaves', LeaveListView.as_view()),
    path('leaves/<int:pk>', LeaveDetailView.as_view()),
]
