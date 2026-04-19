from rest_framework import serializers
from backend.apps.schedule.models import ScheduleEntry


class ScheduleEntrySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    room_code = serializers.CharField(source='room.code', read_only=True)

    class Meta:
        model = ScheduleEntry
        fields = [
            'id',
            'subject',
            'teacher',
            'day',
            'time_slot',
            'room',
            'room_code',
            'description',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ScheduleEntryWriteSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=200)
    teacher = serializers.CharField(max_length=200)
    day = serializers.ChoiceField(choices=[
        'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
    ])
    time_slot = serializers.CharField(max_length=50)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    room = serializers.IntegerField()

    def validate_room(self, value):
        from backend.apps.rooms.models import Room
        if not Room.objects.filter(id=value).exists():
            raise serializers.ValidationError('Room not found.')
        return value

    def validate(self, data):
        from backend.apps.rooms.models import Room
        room = Room.objects.get(id=data['room'])
        instance = self.context.get('instance')
        qs = ScheduleEntry.objects.filter(
            room=room,
            day=data['day'],
            time_slot=data['time_slot'],
        )
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A schedule entry for this room, day, and time slot already exists.'
            )
        return data
