from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('backend.apps.users.urls')),
    path('api/rooms/', include('backend.apps.rooms.urls')),
    path('api/schedule/', include('backend.apps.schedule.urls')),
    path('api/university/', include('backend.apps.university.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
