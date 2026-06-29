from django.urls import path

from .views import LoginView, RegisterView, CheckEmailView, MeView

urlpatterns = [
    path('login', LoginView.as_view()),
    path('register', RegisterView.as_view()),
    path('check-email', CheckEmailView.as_view()),
    path('me', MeView.as_view()),
]
