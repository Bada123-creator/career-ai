from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "target_role", "created_at")
    search_fields = ("user__username", "user__email", "city", "target_role")