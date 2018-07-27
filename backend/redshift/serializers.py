from rest_framework import serializers
from redshift.models import RedShiftDb , UserEmail
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()


class RedshiftDbSerializer(serializers.ModelSerializer):

    '''
    Serializer for User.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = RedShiftDb
        fields = '__all__'


class UserEmailSerializer(serializers.ModelSerializer):

    '''
    Serializer for User.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = UserEmail
        fields = '__all__'


class RedshiftDbCopySerializer(serializers.Serializer):
    s3_key = serializers.CharField()
    redshift_id = serializers.IntegerField()
    delimiter = serializers.CharField()
    csv_line_spliter = serializers.CharField()
    table_name = serializers.CharField()


