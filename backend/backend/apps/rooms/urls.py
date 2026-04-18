from django.urls import path
from backend.apps.rooms.views import join_room, CreateRoomView

urlpatterns = [
    path('create/', CreateRoomView.as_view(), name='room-create'),
    path('join/', join_room, name='room-join'),
]
