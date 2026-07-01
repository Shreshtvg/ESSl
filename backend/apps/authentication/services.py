from rest_framework_simplejwt.tokens import RefreshToken

from apps.activity_logs.services import log_activity
from .models import User
from .serializers import UserSerializer


class UserService:
    def login(self, email, password):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            log_activity(f"Failed login attempt for unknown email '{email}'", 'Auth')
            raise ValueError('User not found')

        if not user.check_password(password):
            log_activity(f"Failed login attempt for '{user.name}' (incorrect password)", 'Auth', user.id)
            raise ValueError('Password incorrect')

        token = RefreshToken.for_user(user).access_token
        log_activity(f"{user.name} logged in", 'Auth', user.id)
        return {
            'token': str(token),
            'user': UserSerializer(user).data,
        }

    def register(self, name, email, password, role='Supervisor'):
        if User.objects.filter(email=email).exists():
            raise ValueError('Email already registered')

        user = User.objects.create_user(
            email=email, name=name, password=password, role=role or 'Supervisor'
        )
        return {'user': UserSerializer(user).data}

    def get_user_by_id(self, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        return UserSerializer(user).data

    def check_email_exists(self, email):
        return User.objects.filter(email=email).exists()


user_service = UserService()
