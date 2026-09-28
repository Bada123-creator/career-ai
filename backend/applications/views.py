from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Application
from .serializers import ApplicationSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def application_list_create(request):
    if request.method == "GET":
        applications = (
            Application.objects
            .filter(user=request.user)
            .select_related("job", "analysis")
            .order_by("-created_at")
        )

        serializer = ApplicationSerializer(
            applications,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    serializer = ApplicationSerializer(
        data=request.data,
        context={"request": request},
    )

    if serializer.is_valid():
        application = serializer.save(
            user=request.user
        )

        return Response(
            ApplicationSerializer(
                application,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def application_detail(request, application_id):
    try:
        application = (
            Application.objects
            .select_related("job", "analysis")
            .get(
                id=application_id,
                user=request.user,
            )
        )
    except Application.DoesNotExist:
        return Response(
            {"detail": "Candidature introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = ApplicationSerializer(
            application,
            context={"request": request},
        )

        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = ApplicationSerializer(
            application,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    application.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT
    )
