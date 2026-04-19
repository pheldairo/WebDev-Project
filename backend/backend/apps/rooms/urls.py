from backend.apps.rooms.views import join_room, CreateRoomView, RoomListView

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('create/', CreateRoomView.as_view(), name='room-create'),
    path('join/', join_room, name='room-join'),
]
