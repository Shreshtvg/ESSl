from django.urls import path

from .views import RosterChangeListView, RosterChangeDetailView

urlpatterns = [
    path('roster-changes', RosterChangeListView.as_view()),
    path('roster-changes/<int:pk>', RosterChangeDetailView.as_view()),
]
