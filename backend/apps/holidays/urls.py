from django.urls import path

from .views import HolidayListView, HolidayDetailView

urlpatterns = [
    path('holidays', HolidayListView.as_view()),
    path('holidays/<int:pk>', HolidayDetailView.as_view()),
]
