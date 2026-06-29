from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.core.utils import success_response, error_response
from .services import user_service


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return error_response('Email and password are required', 400)
        try:
            data = user_service.login(email, password)
            return success_response(data)
        except ValueError as err:
            return error_response(str(err), 401)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')
        if not name or not email or not password:
            return error_response('Name, email and password are required', 400)
        try:
            data = user_service.register(name, email, password, role)
            return success_response(data, status=201)
        except ValueError as err:
            return error_response(str(err), 400)


class CheckEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email', '')
        if not email:
            return error_response('Email is required', 400)
        from rest_framework.response import Response
        exists = user_service.check_email_exists(email)
        return Response({'success': True, 'exists': exists})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = user_service.get_user_by_id(request.user.id)
        if not user:
            return error_response('User not found', 404)
        return success_response(user)
