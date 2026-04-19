from django.urls import path
from backend.apps.users.views import register, LoginView, LogoutView, ProfileUpdateView

urlpatterns = [
    path('register/', register, name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('profile/', ProfileUpdateView.as_view(), name='auth-profile'),
]
