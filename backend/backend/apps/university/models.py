from django.db import models


class Major(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Course(models.Model):
    name = models.CharField(max_length=200)
    major = models.ForeignKey(Major, related_name='courses', on_delete=models.CASCADE)
    semester = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} - Sem {self.semester}"


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

    course = models.ForeignKey(Course, related_name='slots', on_delete=models.CASCADE)
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    time_slot = models.CharField(max_length=50)
    teacher = models.CharField(max_length=200)
    room_ref = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.course.name} ({self.day} {self.time_slot})"
