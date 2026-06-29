from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


class SlidingTokenMiddleware:
    """Refresh the JWT on every authenticated request.

    As long as the client keeps making requests within the access token
    lifetime (15 minutes), it receives a fresh token in the
    ``X-Refreshed-Token`` response header, so the session stays alive. After
    15 minutes of inactivity the token expires and the next request fails
    authentication, logging the user out.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.authenticator = JWTAuthentication()

    def __call__(self, request):
        response = self.get_response(request)

        try:
            result = self.authenticator.authenticate(request)
        except (InvalidToken, TokenError):
            result = None

        if result is not None:
            user, _ = result
            refreshed = AccessToken.for_user(user)
            response['X-Refreshed-Token'] = str(refreshed)

        return response
