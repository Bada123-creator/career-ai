from django.conf import settings
from django.db import models


class Job(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs")
    company = models.CharField(max_length=150)
    title = models.CharField(max_length=150)
    description = models.TextField()
    location = models.CharField(max_length=150, blank=True)
    source_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.company}"