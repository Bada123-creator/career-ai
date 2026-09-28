from django.conf import settings
from django.db import models

from jobs.models import Job


class Application(models.Model):
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("sent", "Envoyée"),
        ("interview", "Entretien"),
        ("accepted", "Acceptée"),
        ("rejected", "Refusée"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    analysis = models.ForeignKey(
        "ai_tools.Analysis",
        on_delete=models.SET_NULL,
        related_name="applications",
        blank=True,
        null=True,
    )

    generated_resume = models.ForeignKey(
        "cvs.GeneratedResume",
        on_delete=models.SET_NULL,
        related_name="applications",
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )

    notes = models.TextField(blank=True)

    applied_at = models.DateField(
        blank=True,
        null=True,
    )

    follow_up_at = models.DateField(
        blank=True,
        null=True,
    )

    next_action = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.job}"