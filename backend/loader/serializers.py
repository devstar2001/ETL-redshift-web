from rest_framework import serializers
from redshift.models import RedShiftDb
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Loader, TransformFilter, LoaderSetting, LoaderList

User = get_user_model()


class LoaderSerializer(serializers.Serializer):
    s3_key = serializers.CharField()
    redshift_id = serializers.IntegerField()
    delimiter = serializers.CharField()
    csv_line_spliter = serializers.CharField()
    table_name = serializers.CharField()


class LoaderCreateSerializer(serializers.ModelSerializer):

    '''
    Serializer for LoaderCreateSerializer.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = Loader
        fields = '__all__'


class LoaderListSerializer(serializers.ModelSerializer):

    '''
    Serializer for LoaderListSerializer.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = LoaderList
        fields = '__all__'



class LoaderSettingsSerializer(serializers.ModelSerializer):

    '''
    Serializer for LoaderListSerializer.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = LoaderSetting
        fields = '__all__'


class TransformFilterSerializer(serializers.ModelSerializer):

    '''
    Serializer for LoaderListSerializer.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = TransformFilter
        fields = '__all__'


