from rest_framework import serializers
from .models import Major, Course, AcademicSlot


class AcademicSlotSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    major_name = serializers.CharField(source='course.major.name', read_only=True)
    semester = serializers.IntegerField(source='course.semester', read_only=True)

    class Meta:
        model = AcademicSlot
        fields = [
            'id', 'course', 'course_name', 'major_name', 'semester',
            'day', 'time_slot', 'teacher', 'room_ref'
        ]
