from rest_framework import serializers
from .models import AcademicSlot


class AcademicSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSlot
        fields = [
            'id', 'subject', 'day', 'time_slot', 'teacher', 'room_ref'
        ]
