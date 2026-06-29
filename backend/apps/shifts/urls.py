from django.urls import path

from .views import ShiftListView, ShiftDetailView

urlpatterns = [
    path('shifts', ShiftListView.as_view()),
    path('shifts/<int:pk>', ShiftDetailView.as_view()),
]
