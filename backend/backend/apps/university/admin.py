from django.contrib import admin
from .models import AcademicSlot


@admin.register(AcademicSlot)
class AcademicSlotAdmin(admin.ModelAdmin):
    list_display = ('subject', 'day', 'time_slot', 'teacher')
    list_filter = ('day',)
    search_fields = ('subject', 'teacher')
