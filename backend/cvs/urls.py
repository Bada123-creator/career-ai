from django.urls import path

from .views import (
    resume_detail,
    resume_list_create,
)


urlpatterns = [
    path(
        "",
        resume_list_create,
        name="resume_list_create",
    ),
    path(
        "<int:resume_id>/",
        resume_detail,
        name="resume_detail",
    ),
]
