from django.urls import path

from .views import DesignationListView, DesignationDetailView

urlpatterns = [
    path('designations', DesignationListView.as_view()),
    path('designations/<int:pk>', DesignationDetailView.as_view()),
]
