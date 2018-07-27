import os
from django.conf import settings
from .serializers import UserSerializer, UserLogoutSerializer
from rest_framework import generics, status
from django.contrib.auth import authenticate
from django_project import key_config
from .models import AuthToken
from .serializers import UserLoginSerializer
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives

from anymail.message import attach_inline_image_file
from django.shortcuts import redirect
from django.conf.urls.static import static

User = get_user_model()


class UserLogin(generics.GenericAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kw):
        username = self.request.data.get(key_config.KEY_USERNAME)
        password = self.request.data.get(key_config.KEY_PASSWORD)

        user = authenticate(username=username, password=password)
        response = {}
        if user:
            auth_token = AuthToken.objects.create(user=user)
            if auth_token:
                response = UserLoginSerializer(auth_token).data
                return Response(response, status=status.HTTP_200_OK)

        else:
            response['error'] = ['Invalid Credentials']
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)


class UserSignUp(generics.GenericAPIView):
    serializer_class = UserSerializer
    # queryset = User.objects.all()

    def post(self, request, *args, **kw):
        response = {}
        username = self.request.data.get(key_config.KEY_USERNAME)
        password = self.request.data.get(key_config.KEY_PASSWORD)
        first_name = self.request.data.get(key_config.KEY_FIRST_NAME)
        last_name = self.request.data.get(key_config.KEY_LAST_NAME)

        user = User.objects.filter(
            username__iexact=username)
        if user:
            response['error'] = ['User-name Already Exist']
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)
        else:
            now = timezone.now()
            extra_data = {'first_name': first_name, 'last_name': last_name}
            user = User(username=username, email=username,
                        is_staff=False, is_active=False,
                        is_superuser=False,
                        date_joined=now,
                        **extra_data)
            user.set_password(password)

            user.save()

            auth_token = AuthToken.objects.create(user=user)
            send_flag = send_email(auth_token.token, first_name + " " + last_name, username)
            if auth_token and send_flag:
                return Response(response, status=status.HTTP_200_OK)
            if not send_flag:
                response['error'] = ['Mailgun response. Not valid address.']
                return Response(response, status=status.HTTP_401_UNAUTHORIZED)

        response['error'] = ['Not Authorized']
        return Response(response, status=status.HTTP_401_UNAUTHORIZED)


class UserLogout(generics.GenericAPIView):
    serializer_class = UserLogoutSerializer

    def post(self, request, *args, **kw):
        token = self.request.data.get(key_config.KEY_TOKEN)
        response = {}
        serializer_data = UserLogoutSerializer(data=self.request.data)
        if serializer_data.is_valid():
            AuthToken.objects.expire_token(token=token)
            return Response(response, status=status.HTTP_200_OK)
        else:
            response['error'] = serializer_data.errors
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)


class UserActivate(generics.GenericAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kw):
        token = self.request.data.get(key_config.KEY_TOKEN)
        response = {}
        try:
            auth_token = AuthToken.objects.get(token=token)
            if auth_token:
                user = User.objects.get(username=auth_token.user)
                if not user.is_active:
                    user.is_active = True
                    user.save()
                response = UserLoginSerializer(auth_token).data
                return Response(response, status=status.HTTP_200_OK)
            response['error'] = ['No correct token']
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as exc:
            response = self.handle_exception(exc)
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)


class SendMailForResetPassword(generics.GenericAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kw):
        username = self.request.data.get(key_config.KEY_USERNAME)
        response = {}
        try:
            user = User.objects.get(username=username)
        except:
            response['error'] = ['No exist this email']
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)
        if user:
            send_email_reset_password_link(user.username)
            return Response(response, status=status.HTTP_200_OK)


class ChangePassword(generics.GenericAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kw):
        username = self.request.data.get(key_config.KEY_USERNAME)
        userpass = self.request.data.get(key_config.KEY_PASSWORD)
        response = {}
        try:
            user = User.objects.get(username=username)
            user.set_password(userpass)
            user.save()
            return Response(response, status=status.HTTP_200_OK)
        except:
            response['error'] = ['No exist this email']
            return Response(response, status=status.HTTP_401_UNAUTHORIZED)



def send_email_reset_password_link(email=None):
    """
    Send email to admin or user.
    :param email:
    :return:
    """
    # full_path = os.path.realpath(__file__)
    # file_path = '%s/a.txt' % os.path.dirname(full_path)
    try:
        if email:
            msg = EmailMultiAlternatives(
                subject="[DATAEXO] Reset your password",
                body="No worry if you forgot password",
                from_email="DATAEXO <message@dataexo.com>",
                to=[email],
                reply_to=["DATAEXO <support@dataexo.com>"])

            ahref = """<a href="http://""" + settings.SITE_DOMAIN + """/#/front/change?user_email=""" + str(
                email) + """">Click here</a>"""
            # logo_cid = attach_inline_image_file(msg, os.path.dirname(full_path)+'/static/img/logo.png')
            html = """
            <div><table><tbody>
            <tr><h3>Hi, """ + email + """ </h3></tr><tr><h4> Did you forget password to work in DATAEXO ?</h4></tr>
            <tr>
                <table>
                    <tbody>
                    <tr>
                        <td width=30>&nbsp;</td>
                        <td width=32 style="padding-top:30px;padding-bottom:32px;width:32px" valign="middle">
                            <img width="50" height="25" style="display:block;vertical-align:top" alt="Logo" src="https://ci5.googleusercontent.com/proxy/JEJXSgwcrst6ovJ_vSVTr320W1yFnzyjnd6ai5Eh0zsnzbSYH2wn1Ox8VoTU3ZFOtskE3OZQ35U65aZ-vy7qX-h9KMryJoRPUVvWZ3_r1858wX2EdnRS2r5I89bbmGS0NZfKTA=s0-d-e1-ft#http://landing.adobe.com/dam/global/images/creative-cloud.logo.red.268x200.png"></td>
                        <td style="color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;padding-top:30px;padding-bottom:32px" valign="middle">No worry. It is simple.""" + ahref + """ </td>
                    </tr></tbody>
                </table>
            </tr>
            </tbody></table><div>
                """
            msg.attach_alternative(html, "text/html")
            # Optional Anymail extensions:
            # msg.metadata = {"user_id": "8675309", "experiment_variation": 1}
            # msg.tags = ["activation", "onboarding"]
            msg.track_clicks = True
            msg.tags = ["Approving"]

        send_flag = msg.send()
        print("reset mail send successful : " + str(send_flag))
        print(ahref)
        return True;
    except Exception as e:
        print('Exception: {}'.format(e))
        return False;


def send_email(token=None, username=None, email=None):
    """
    Send email to admin or user.
    :param email:
    :return:
    """
    # full_path = os.path.realpath(__file__)
    # file_path = '%s/a.txt' % os.path.dirname(full_path)
    try:
        if token:
            msg = EmailMultiAlternatives(
                subject="Waiting for approval",
                body="A new user has signed up and their account is pending approval.\n\n\n" +
                     " Account email is " + email + "\n User Name is " + username,
                from_email="DATAEXO <message@dataexo.com>",
                to=[username+" <"+email+">"],
                reply_to=["DATAEXO <support@dataexo.com>"])

            ahref="""<a href="http://"""+settings.SITE_DOMAIN+"""/#/front/active?token="""+str(token)+"""">activate</a>"""
            # logo_cid = attach_inline_image_file(msg, os.path.dirname(full_path)+'/static/img/logo.png')
            html = """
            <div><table><tbody>
            <tr><h3>Hi, """ + username + """ </h3></tr><tr><h4> You has signed up and your account is pending approval.</h4></tr>
            <tr>
                <table>
                    <tbody>
                    <tr>
                        <td width=30>&nbsp;</td>
                        <td width=32 style="padding-top:30px;padding-bottom:32px;width:32px" valign="middle">
                            <img width="50" height="25" style="display:block;vertical-align:top" alt="Logo" src="https://ci5.googleusercontent.com/proxy/JEJXSgwcrst6ovJ_vSVTr320W1yFnzyjnd6ai5Eh0zsnzbSYH2wn1Ox8VoTU3ZFOtskE3OZQ35U65aZ-vy7qX-h9KMryJoRPUVvWZ3_r1858wX2EdnRS2r5I89bbmGS0NZfKTA=s0-d-e1-ft#http://landing.adobe.com/dam/global/images/creative-cloud.logo.red.268x200.png"></td>
                        <td style="color:#333333;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;padding-top:30px;padding-bottom:32px" valign="middle">Please """+ahref+""" your account</td>
                    </tr></tbody>
                </table>
            </tr>
            </tbody></table><div>
                """
            msg.attach_alternative(html, "text/html")
            # Optional Anymail extensions:
            # msg.metadata = {"user_id": "8675309", "experiment_variation": 1}
            # msg.tags = ["activation", "onboarding"]
            msg.track_clicks = True
            msg.tags = ["Approving"]

        sent = msg.send()
        print("confirm mail send successful : " + str(sent))
        print(ahref)
        return True
    except Exception as e:
        print('Exception: {}'.format(e))
        return False
