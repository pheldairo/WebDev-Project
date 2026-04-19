from django.db import models
from django.conf import settings
from backend.apps.rooms.models import Room


class ScheduleEntry(models.Model):
    DAY_CHOICES = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    ]

    subject = models.CharField(max_length=200)
    teacher = models.CharField(max_length=200)
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    time_slot = models.CharField(max_length=50)
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name='schedule_entries',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='schedule_entries',
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('room', 'day', 'time_slot')

    def __str__(self):
        return f'{self.subject} - {self.day} {self.time_slot}'
