from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'bio', 'profile_picture', 'saved_slots'
        ]
        read_only_fields = ['id']


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
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'bio', 'profile_picture', 'saved_slots', 'password']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False}
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Manually handle many-to-many if needed, though ModelSerializer usually handles it
        return super().update(instance, validated_data)
