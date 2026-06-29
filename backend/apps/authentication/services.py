from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserService:
    def login(self, email, password):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValueError('User not found')

        if not user.check_password(password):
            raise ValueError('Password incorrect')

        token = RefreshToken.for_user(user).access_token
        return {
            'token': str(token),
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
            },
        }

    def register(self, name, email, password, role='Supervisor'):
        if User.objects.filter(email=email).exists():
            raise ValueError('Email already registered')

        user = User.objects.create_user(
            email=email, name=name, password=password, role=role or 'Supervisor'
        )
        return {
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
            }
        }

    def get_user_by_id(self, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        return {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}

    def check_email_exists(self, email):
        return User.objects.filter(email=email).exists()


user_service = UserService()
