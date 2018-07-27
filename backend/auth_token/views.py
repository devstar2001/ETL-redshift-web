# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.http import HttpResponse
from rest_framework import generics, status
from django.shortcuts import render
from django_project import key_config
from .models import AuthToken
from django.contrib.auth import get_user_model
# from .serializers import UserSerializer, UserLogoutSerializer, UserLoginSerializer
from django.shortcuts import redirect


User = get_user_model()
# Create your views here.
# def activate(request, uidb64, token):
#     try:
#         uid = force_text(urlsafe_base64_decode(uidb64))
#         user = User.objects.get(pk=uid)
#     except(TypeError, ValueError, OverflowError, User.DoesNotExist):
#         user = None
#     if user is not None and account_activation_token.check_token(user, token):
#         user.is_active = True
#         user.save()
#         login(request, user)
#         # return redirect('home')
#         return HttpResponse('Thank you for your email confirmation. Now you can login your account.')
#     else:
#         return HttpResponse('Activation link is invalid!')

# def activate(request):
#     token = request.GET.get('token')
#     auth_token = AuthToken.objects.get(token=token)
#     if auth_token:
#         user = User.objects.get(username=auth_token.user)
#         username = user.email.split("@",0)
#         if user.is_active ==False :
#             user.is_active = True
#             user.save()
#     # response = UserLoginSerializer(auth_token).data
#     return render(request, 'acc_active_email.html', {'username':username})