from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = 'Access forbidden: Insufficient privileges'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'Admin')


class IsAdminOrSupervisor(BasePermission):
    message = 'Access forbidden: Insufficient privileges'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ['Admin', 'Supervisor']
        )


class IsSupervisor(BasePermission):
    message = 'Access forbidden: Insufficient privileges'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == 'Supervisor'
        )
