from django.urls import path

from .views import (
    job_detail,
    job_import_preview,
    job_list_create,
    job_search,
)


urlpatterns = [
    path(
        "search/",
        job_search,
        name="job_search",
    ),
    path(
        "import-preview/",
        job_import_preview,
        name="job_import_preview",
    ),
    path("", job_list_create, name="job_list_create"),
    path(
        "<int:job_id>/",
        job_detail,
        name="job_detail",
    ),
]
