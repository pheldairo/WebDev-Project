import json
from channels.generic.websocket import AsyncWebsocketConsumer

class VoiceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Присоединиться к группе комнаты
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"WebSocket connected: {self.channel_name} to room {self.room_name}")

    async def disconnect(self, close_code):
        # Покинуть группу комнаты
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"WebSocket disconnected from room {self.room_name} with code {close_code}")

    # Получение сообщения от WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        message_payload = data.get('payload')

        print(f"Received message in room {self.room_name}: {message_type}")

        # Отправить сообщение в группу комнаты
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'webrtc_message',
                'sender_channel_name': self.channel_name,
                'message_type': message_type,
                'payload': message_payload,
            }
        )

    # Получение сообщения из группы комнаты
    async def webrtc_message(self, event):
        # Не отправлять сообщение обратно отправителю
        if self.channel_name == event['sender_channel_name']:
            return

        # Отправить сообщение обратно через WebSocket
        await self.send(text_data=json.dumps({
            'type': event['message_type'],
            'payload': event['payload'],
        }))
