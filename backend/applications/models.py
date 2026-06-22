from django.conf import settings
from django.db import models


class Application(models.Model):
    STATUS_CHOICES = [
        ("draft", "Brouillon"),
        ("sent", "Envoyée"),
        ("interview", "Entretien"),
        ("accepted", "Acceptée"),
        ("rejected", "Refusée"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications")
    job = models.ForeignKey("jobs.Job", on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    notes = models.TextField(blank=True)
    applied_at = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job.title} - {self.status}"