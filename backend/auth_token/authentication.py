from rest_framework import authentication
from rest_framework import exceptions
from .models import AuthToken
from django.core.exceptions import ValidationError


class RestAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # get the token request header
        token = request.META.get('HTTP_AUTHORIZATION')
        if not token:  # no token passed
            return None  # authentication did not succeed
        try:
            user = AuthToken.objects.is_token_valid(token=token)
        except ValidationError:
            raise exceptions.AuthenticationFailed('Token not valid')
        if not user:
            raise exceptions.AuthenticationFailed('No such user')

        return (user, None)  # authentication successful
