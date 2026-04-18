from django.urls import path
from backend.apps.schedule.views import ScheduleListCreateView, ScheduleDetailView, my_schedule_entries

urlpatterns = [
    path('', ScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('<int:pk>/', ScheduleDetailView.as_view(), name='schedule-detail'),
    path('mine/', my_schedule_entries, name='schedule-mine'),
]
