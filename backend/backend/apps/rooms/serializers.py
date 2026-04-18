from rest_framework import serializers
from backend.apps.rooms.models import Room, Participant


class RoomSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'code', 'created_by', 'created_at', 'participants_count']
        read_only_fields = ['id', 'code', 'created_by', 'created_at']

    def get_participants_count(self, obj):
        return obj.participants.count()


class ParticipantModelSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    room_code = serializers.CharField(source='room.code', read_only=True)

    class Meta:
        model = Participant
        fields = ['id', 'user', 'username', 'room', 'room_code', 'color', 'joined_at']
        read_only_fields = ['id', 'user', 'color', 'joined_at']


class JoinRoomSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=8)

    def validate_code(self, value):
        if not Room.objects.filter(code=value).exists():
            raise serializers.ValidationError('Room with this code does not exist.')
        return value


class CreateRoomSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
