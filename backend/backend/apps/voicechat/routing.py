from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # Используем path вместо re_path для простоты и избежания ошибок с регулярными выражениями
    path('ws/voicechat/<str:room_name>/', consumers.VoiceChatConsumer.as_asgi()),
]
