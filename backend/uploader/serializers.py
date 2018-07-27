from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from django import forms
from .models import Scraper
User = get_user_model()


class UserLogoutSerializer(serializers.Serializer):
    token = serializers.UUIDField()

#
# class FileSerializer(serializers.ModelSerializer):
#
#   class Meta():
#
#     model = File
#     fields = ('file')

class UploadFileForm(forms.Form):
    # title = forms.CharField(max_length=50)
    file = forms.FileField()


class ScraperSerializer(serializers.ModelSerializer):

    '''
    Serializer for LoaderListSerializer.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = Scraper
        fields = '__all__'
