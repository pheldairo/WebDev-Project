from django.urls import path
from .views import AcademicSlotListView

urlpatterns = [
    path('slots/', AcademicSlotListView.as_view(), name='academic-slots-list'),
]
