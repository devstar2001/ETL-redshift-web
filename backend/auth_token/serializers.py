from rest_framework import serializers, mixins
from .models import AuthToken
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    '''
    Serializer for User.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {
                'write_only': True,
            },
        }

    def create(self, validated_data):
        '''
        create new user
        '''
        return User.objects.create_user(**validated_data)


class UserLoginSerializer(serializers.ModelSerializer):

    '''
    Serializer for User.
    '''
    class Meta:
        '''
        Serializer customization
        '''
        model = AuthToken
        fields = ('token', 'user')

    def to_representation(self, data):
        data = super(UserLoginSerializer, self).to_representation(data)
        if data['user']:
            user = User.objects.filter(id=data['user']).first()
            if user:
                data['user'] = UserSerializer(user).data
        return data


class UserLogoutSerializer(serializers.Serializer):
    token = serializers.UUIDField()
