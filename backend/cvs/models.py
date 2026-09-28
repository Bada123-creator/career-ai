from django.conf import settings
from django.db import models


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes",
    )

    title = models.CharField(max_length=150)
    file = models.FileField(
        upload_to="resumes/",
        blank=True,
        null=True,
    )
    extracted_text = models.TextField(blank=True)

    skills = models.TextField(blank=True)
    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

class GeneratedResume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generated_resumes",
    )
    source_resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="generated_versions",
    )
    analysis = models.ForeignKey(
        "ai_tools.Analysis",
        on_delete=models.CASCADE,
        related_name="generated_resumes",
    )
    title = models.CharField(
        max_length=150,
    )
    content = models.JSONField(
        default=dict,
        blank=True,
    )
    version = models.PositiveIntegerField(
        default=1,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "analysis",
                    "version",
                ],
                name="unique_generated_resume_version",
            ),
        ]

    def __str__(self):
        return (
            f"{self.title} "
            f"- v{self.version} "
            f"- Analysis #{self.analysis_id}"
        )
