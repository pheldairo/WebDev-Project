from django.contrib import admin
from .models import Major, Course, AcademicSlot


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'major', 'semester')
    list_filter = ('major', 'semester')
    search_fields = ('name',)


@admin.register(AcademicSlot)
class AcademicSlotAdmin(admin.ModelAdmin):
    list_display = ('course', 'day', 'time_slot', 'teacher')
    list_filter = ('day', 'course__major')
    search_fields = ('course__name', 'teacher')
