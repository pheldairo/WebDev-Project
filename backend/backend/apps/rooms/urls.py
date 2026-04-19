from django.urls import path
from backend.apps.rooms.views import (
    join_room, CreateRoomView, RoomListView, 
    RoomParticipantsView, leave_room, delete_room
)

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('create/', CreateRoomView.as_view(), name='room-create'),
    path('join/', join_room, name='room-join'),
    path('<int:room_id>/participants/', RoomParticipantsView.as_view(), name='room-participants'),
    path('<int:room_id>/leave/', leave_room, name='room-leave'),
    path('<int:room_id>/delete/', delete_room, name='room-delete'),
]
