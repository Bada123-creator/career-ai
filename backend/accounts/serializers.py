from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "email",
            "phone",
            "city",
            "target_role",
            "bio",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "created_at",
            "updated_at",
        ]