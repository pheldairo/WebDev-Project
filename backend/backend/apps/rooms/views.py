import random
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from backend.apps.rooms.models import Room, Participant
from backend.apps.rooms.serializers import (
    RoomSerializer,
    ParticipantModelSerializer,
    JoinRoomSerializer,
    CreateRoomSerializer,
)


def generate_hex_color():
    return '#{:06x}'.format(random.randint(0, 0xFFFFFF))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request):
    serializer = JoinRoomSerializer(data=request.data)
    if serializer.is_valid():
        code = serializer.validated_data['code']
        password = serializer.validated_data.get('password')
        room = Room.objects.get(code=code)

        # Check if room has password and verify if it matches
        if room.password and not check_password(password, room.password):
            return Response(
                {'password': ['Incorrect password for this room.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Participant.objects.filter(user=request.user, room=room).exists():
            participant = Participant.objects.get(user=request.user, room=room)
            return Response(
                ParticipantModelSerializer(participant).data,
                status=status.HTTP_200_OK,
            )

        color = generate_hex_color()
        participant = Participant.objects.create(
            user=request.user,
            room=room,
            color=color,
        )
        return Response(
            ParticipantModelSerializer(participant).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateRoomSerializer(data=request.data)
        if serializer.is_valid():
            password = serializer.validated_data.get('password')
            hashed_password = make_password(password) if password else None
            
            room = Room.objects.create(
                name=serializer.validated_data['name'],
                password=hashed_password,
                created_by=request.user,
            )
            color = generate_hex_color()
            Participant.objects.create(
                user=request.user,
                room=room,
                color=color,
            )
            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomListView(ListAPIView):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(participants__user=self.request.user)

class RoomParticipantsView(ListAPIView):
    serializer_class = ParticipantModelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        return Participant.objects.filter(room_id=room_id)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_room(request, room_id):
    Participant.objects.filter(user=request.user, room_id=room_id).delete()
    return Response(status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_room(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        if room.created_by != request.user:
            return Response({'detail': 'Only the creator can delete this room.'}, status=status.HTTP_403_FORBIDDEN)
        
        room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Room.DoesNotExist:
        return Response({'detail': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)
