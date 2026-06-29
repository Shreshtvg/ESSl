from django.urls import path

from .views import DepartmentListView, DepartmentDetailView

urlpatterns = [
    path('departments', DepartmentListView.as_view()),
    path('departments/<int:pk>', DepartmentDetailView.as_view()),
]
