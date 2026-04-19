from django.db import models


class AcademicSlot(models.Model):
    DAY_CHOICES = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    ]

    subject = models.CharField(max_length=200, default='Unknown')
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    time_slot = models.CharField(max_length=50)
    teacher = models.CharField(max_length=200)
    room_ref = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.subject} ({self.day} {self.time_slot})"
