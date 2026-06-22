from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import UserProfile
from .serializers import UserProfileSerializer


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def my_profile(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)