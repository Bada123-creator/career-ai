from django.urls import path

from .views import my_profile, register


urlpatterns = [
    path("register/", register, name="register"),
    path("me/", my_profile, name="my_profile"),
]




