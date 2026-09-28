from django.urls import path

from .views import (
    application_detail,
    application_list_create,
)


urlpatterns = [
    path(
        "",
        application_list_create,
        name="application_list_create",
    ),
    path(
        "<int:application_id>/",
        application_detail,
        name="application_detail",
    ),
]
