from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from backend.apps.rooms.models import Room
from backend.apps.schedule.models import ScheduleEntry
from backend.apps.university.models import AcademicSlot
from backend.apps.schedule.serializers import ScheduleEntrySerializer, ScheduleEntryWriteSerializer


class ScheduleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        room_id = request.query_params.get('room')
        if room_id:
            # Show entries that are public OR owned by the user
            entries = ScheduleEntry.objects.filter(
                Q(room_id=room_id) & 
                (Q(is_private=False) | Q(created_by=request.user))
            )
        else:
            # Default to user's entries if no room specified
            entries = ScheduleEntry.objects.filter(created_by=request.user)
            
        serializer = ScheduleEntrySerializer(entries, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ScheduleEntryWriteSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            room = Room.objects.get(id=data['room'])
            entry = ScheduleEntry.objects.create(
                subject=data['subject'],
                teacher=data['teacher'],
                day=data['day'],
                time_slot=data['time_slot'],
                description=data.get('description'),
                room=room,
                created_by=request.user,
                entry_type='NOTE', # Default for manual entries
                is_private=False # Notes are public by default
            )
            return Response(ScheduleEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmSelectionView(APIView):
    """
    Takes a list of AcademicSlot IDs and a Room ID, then creates private ScheduleEntries.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        slot_ids = request.data.get('slots', [])
        room_id = request.data.get('room')
        
        if not room_id:
            return Response({'detail': 'room id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({'detail': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
            
        slots = AcademicSlot.objects.filter(id__in=slot_ids)
        new_entries = []
        
        for slot in slots:
            # Check if an entry for this slot already exists for this user in this room
            if not ScheduleEntry.objects.filter(room=room, academic_slot=slot, created_by=request.user).exists():
                entry = ScheduleEntry.objects.create(
                    subject=slot.course.name,
                    teacher=slot.teacher,
                    day=slot.day,
                    time_slot=slot.time_slot,
                    room=room,
                    academic_slot=slot,
                    created_by=request.user,
                    entry_type='ACADEMIC',
                    is_private=False # Academic slots are private to the user
                )
                new_entries.append(entry)
                
        return Response(
            ScheduleEntrySerializer(new_entries, many=True).data,
            status=status.HTTP_201_CREATED
        )


class ScheduleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return ScheduleEntry.objects.get(pk=pk)
        except ScheduleEntry.DoesNotExist:
            return None

    def get(self, request, pk):
        entry = self.get_object(pk)
        if entry is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ScheduleEntrySerializer(entry).data)

    def put(self, request, pk):
        entry = self.get_object(pk)
        if entry is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ScheduleEntryWriteSerializer(
            data=request.data,
            context={'instance': entry},
        )
        if serializer.is_valid():
            data = serializer.validated_data
            room = Room.objects.get(id=data['room'])
            entry.subject = data['subject']
            entry.teacher = data['teacher']
            entry.day = data['day']
            entry.time_slot = data['time_slot']
            entry.description = data.get('description', entry.description)
            entry.room = room
            entry.save()
            return Response(ScheduleEntrySerializer(entry).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        entry = self.get_object(pk)
        if entry is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ScheduleEntryWriteSerializer(
            data={
                'subject': request.data.get('subject', entry.subject),
                'teacher': request.data.get('teacher', entry.teacher),
                'day': request.data.get('day', entry.day),
                'time_slot': request.data.get('time_slot', entry.time_slot),
                'description': request.data.get('description', entry.description),
                'room': request.data.get('room', entry.room.id),
            },
            context={'instance': entry},
        )
        if serializer.is_valid():
            data = serializer.validated_data
            room = Room.objects.get(id=data['room'])
            entry.subject = data['subject']
            entry.teacher = data['teacher']
            entry.day = data['day']
            entry.time_slot = data['time_slot']
            entry.room = room
            entry.save()
            return Response(ScheduleEntrySerializer(entry).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        entry = self.get_object(pk)
        if entry is None:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_schedule_entries(request):
    entries = ScheduleEntry.objects.filter(created_by=request.user)
    serializer = ScheduleEntrySerializer(entries, many=True)
    return Response(serializer.data)
