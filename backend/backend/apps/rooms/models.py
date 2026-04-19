import random
import string
from django.db import models
from django.conf import settings


def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class Room(models.Model):
    CATEGORY_CHOICES = [
        ('UNIVERSITY', 'University'),
        ('WORK', 'Work'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=8, unique=True, default=generate_room_code)
    password = models.CharField(max_length=128, blank=True, null=True)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='UNIVERSITY',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.code})'


class Participant(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participations',
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='participants',
    )
    color = models.CharField(max_length=7)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'room')

    def __str__(self):
        return f'{self.user.username} in {self.room.code}'
