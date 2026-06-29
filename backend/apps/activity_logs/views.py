from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.core.utils import success_response
from .services import activity_log_service


class ActivityLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(activity_log_service.get_logs())
