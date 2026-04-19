from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    major = models.ForeignKey(
        'university.Major',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    semester = models.PositiveIntegerField(default=1)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username
