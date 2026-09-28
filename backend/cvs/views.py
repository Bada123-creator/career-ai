from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai_tools.models import Analysis

from .models import Resume
from .serializers import ResumeSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def resume_list_create(request):

    if request.method == "GET":
        resumes = Resume.objects.filter(user=request.user).order_by("-created_at")
        serializer = ResumeSerializer(resumes, many=True)
        return Response(serializer.data)

    serializer = ResumeSerializer(data=request.data)

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
def resume_detail(request, resume_id):
    try:
        resume = Resume.objects.get(
            id=resume_id,
            user=request.user,
        )
    except Resume.DoesNotExist:
        return Response(
            {
                "detail": "CV introuvable.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = ResumeSerializer(resume)
        return Response(serializer.data)

    # On empêche la suppression d'un CV déjà utilisé
    # par une analyse afin de préserver l'historique.
    if Analysis.objects.filter(
        user=request.user,
        resume=resume,
    ).exists():
        return Response(
            {
                "detail": (
                    "Ce CV est utilisé par une ou plusieurs "
                    "analyses et ne peut pas être supprimé."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    if resume.file:
        resume.file.delete(save=False)

    resume.delete()

    return Response(
        status=status.HTTP_204_NO_CONTENT,
    )
