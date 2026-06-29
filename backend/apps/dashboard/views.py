from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.utils import success_response
from .services import dashboard_service


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(dashboard_service.get_statistics())


class NotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(dashboard_service.get_pending_counts())
