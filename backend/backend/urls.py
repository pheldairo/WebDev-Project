from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('backend.apps.users.urls')),
    path('api/rooms/', include('backend.apps.rooms.urls')),
    path('api/schedule/', include('backend.apps.schedule.urls')),
]
