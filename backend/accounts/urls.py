from django.urls import path
from .views import my_profile


urlpatterns = [
    path("me/", my_profile),
]