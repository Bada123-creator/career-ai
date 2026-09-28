from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Job
from .serializers import JobSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def job_list_create(request):

    if request.method == "GET":
        jobs = Job.objects.filter(
            user=request.user
        ).order_by("-created_at")

        serializer = JobSerializer(
            jobs,
            many=True,
        )

        return Response(serializer.data)

    serializer = JobSerializer(
        data=request.data
    )

    if serializer.is_valid():
        serializer.save(user=request.user)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def job_detail(request, job_id):
    try:
        job = Job.objects.get(
            id=job_id,
            user=request.user,
        )
    except Job.DoesNotExist:
        return Response(
            {"detail": "Offre introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = JobSerializer(job)
        return Response(serializer.data)

    # Une offre déjà utilisée doit rester disponible
    # pour préserver l'historique CareerAI.
    from ai_tools.models import Analysis
    from applications.models import Application

    used_by_analysis = Analysis.objects.filter(
        user=request.user,
        job=job,
    ).exists()

    used_by_application = Application.objects.filter(
        user=request.user,
        job=job,
    ).exists()

    if used_by_analysis or used_by_application:
        return Response(
            {
                "detail": (
                    "Cette offre est utilisée par une analyse "
                    "ou une candidature et ne peut pas être supprimée."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    job.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def job_import_preview(request):
    from ai_tools.ai_service import (
        extract_job_from_page_with_ai,
    )
    from .job_import_service import (
        JobImportError,
        extract_job_page_text,
    )

    url = request.data.get("url", "")

    if not isinstance(url, str) or not url.strip():
        return Response(
            {
                "detail": (
                    "L'URL de l'offre est obligatoire."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        page = extract_job_page_text(
            url.strip()
        )

    except JobImportError as exc:
        return Response(
            {
                "detail": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        extracted = extract_job_from_page_with_ai(
            page_title=page["page_title"],
            meta_description=page[
                "meta_description"
            ],
            page_text=page["text"],
            source_url=page["source_url"],
        )

    except Exception as exc:
        print(
            "CAREERAI JOB IMPORT AI ERROR:",
            exc,
        )

        return Response(
            {
                "detail": (
                    "CareerAI n'a pas pu analyser "
                    "cette page pour le moment."
                )
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            "source_url": page["source_url"],
            "title": extracted["title"],
            "company": extracted["company"],
            "location": extracted["location"],
            "description": extracted["description"],
            "is_job_offer": extracted[
                "is_job_offer"
            ],
            "confidence": extracted[
                "confidence"
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def job_search(request):
    from .job_search_service import (
        JobSearchError,
        search_jobs,
    )

    query = request.query_params.get(
        "query",
        "",
    )
    location = request.query_params.get(
        "location",
        "",
    )
    page = request.query_params.get(
        "page",
        1,
    )

    if not query.strip():
        return Response(
            {
                "detail": (
                    "Le paramètre query est obligatoire."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        results = search_jobs(
            query=query,
            location=location,
            page=page,
        )

    except JobSearchError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(results)
