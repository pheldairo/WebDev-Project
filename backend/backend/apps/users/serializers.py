from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelSerializer(serializers.ModelSerializer):
    major_name = serializers.CharField(source='major.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'profile_picture', 
            'major', 'major_name', 'semester'
        ]
        read_only_fields = ['id', 'username', 'email']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_picture', 'major', 'semester']
