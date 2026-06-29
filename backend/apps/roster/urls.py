from django.urls import path

from .views import RosterListView, RosterDeleteView

urlpatterns = [
    path('rosters', RosterListView.as_view()),
    path('rosters/<int:employee_id>/<str:date>', RosterDeleteView.as_view()),
]
