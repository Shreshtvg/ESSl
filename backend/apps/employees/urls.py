from django.urls import path

from .views import EmployeeListView, EmployeeDetailView

urlpatterns = [
    path('employees', EmployeeListView.as_view()),
    path('employees/<int:pk>', EmployeeDetailView.as_view()),
]
