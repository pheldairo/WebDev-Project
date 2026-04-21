from rest_framework import serializers
from backend.apps.rooms.models import Room, Participant


class RoomSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()
    has_password = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'code', 'created_by',
            'created_at', 'participants_count', 'has_password'
        ]
        read_only_fields = ['id', 'code', 'created_by', 'created_at']

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_has_password(self, obj):
        return bool(obj.password)


class ParticipantModelSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    room_code = serializers.CharField(source='room.code', read_only=True)

    class Meta:
        model = Participant
        fields = ['id', 'user', 'username', 'room', 'room_code', 'color', 'joined_at']
        read_only_fields = ['id', 'user', 'color', 'joined_at']


class CreateRoomSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    # Добавили allow_null=True и дефолтное значение
    password = serializers.CharField(
        max_length=128,
        required=False,
        allow_blank=True,
        allow_null=True,
        default=""
    )


class JoinRoomSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    # Здесь тоже лучше добавить allow_null
    password = serializers.CharField(
        max_length=128,
        required=False,
        allow_blank=True,
        allow_null=True,
        default=""
    )

    def validate_code(self, value):
        if not Room.objects.filter(code=value).exists():
            raise serializers.ValidationError('Room with this code does not exist.')
        return value