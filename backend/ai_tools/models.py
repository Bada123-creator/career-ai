from django.conf import settings
from django.db import models

from cvs.models import Resume
from jobs.models import Job


class Analysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analyses",
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="analyses",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="analyses",
    )

    overall_score = models.FloatField()

    coverage_score = models.FloatField(
        default=100.0,
    )

    confidence_level = models.CharField(
        max_length=10,
        choices=[
            ("low", "Faible"),
            ("medium", "Moyenne"),
            ("high", "Élevée"),
        ],
        default="high",
    )

    skill_score = models.FloatField(
        null=True,
        blank=True,
    )

    experience_score = models.FloatField(
        null=True,
        blank=True,
    )

    education_score = models.FloatField(
        null=True,
        blank=True,
    )

    matching_skills = models.JSONField(
        default=list,
        blank=True,
    )

    essential_skills = models.JSONField(
        default=list,
        blank=True,
    )

    complementary_skills = models.JSONField(
        default=list,
        blank=True,
    )

    missing_skills = models.JSONField(
        default=list,
        blank=True,
    )

    ai_available = models.BooleanField(
        default=False,
    )

    ai_analysis = models.JSONField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.job.title} - "
            f"{self.resume.title} - "
            f"{self.overall_score:.0f}%"
        )


class CoverLetter(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cover_letters",
    )

    analysis = models.ForeignKey(
        Analysis,
        on_delete=models.CASCADE,
        related_name="cover_letters",
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Lettre - {self.analysis.job.title} - "
            f"{self.analysis.job.company}"
        )


class InterviewPreparation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_preparations",
    )

    analysis = models.ForeignKey(
        Analysis,
        on_delete=models.CASCADE,
        related_name="interview_preparations",
    )

    questions = models.JSONField(
        default=list,
        blank=True,
    )

    general_advice = models.JSONField(
        default=list,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Entretien - {self.analysis.job.title} - "
            f"{self.analysis.job.company}"
        )


class InterviewAnswer(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_answers",
    )

    preparation = models.ForeignKey(
        InterviewPreparation,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    question_index = models.PositiveIntegerField()

    question_type = models.CharField(
        max_length=20,
    )

    question = models.TextField()

    answer = models.TextField()

    feedback = models.JSONField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["question_index"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "preparation",
                    "question_index",
                ],
                name="unique_interview_answer_per_question",
            )
        ]

    def __str__(self):
        return (
            f"Réponse entretien - "
            f"{self.preparation.analysis.job.title} - "
            f"Q{self.question_index + 1}"
        )


class InterviewReport(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_reports",
    )

    preparation = models.OneToOneField(
        InterviewPreparation,
        on_delete=models.CASCADE,
        related_name="final_report",
    )

    average_score = models.FloatField()

    report = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"Bilan entretien - "
            f"{self.preparation.analysis.job.title} - "
            f"{self.average_score:.1f}/100"
        )


class CVOptimization(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cv_optimizations",
    )
    analysis = models.OneToOneField(
        Analysis,
        on_delete=models.CASCADE,
        related_name="cv_optimization",
    )
    optimization = models.JSONField(
        default=dict,
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"CV Optimization #{self.id} "
            f"- Analysis #{self.analysis_id}"
        )


class JobRecommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_recommendations",
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="job_recommendations",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )

    score = models.FloatField()

    result = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-score",
            "-updated_at",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "resume",
                    "job",
                ],
                name="unique_job_recommendation",
            ),
        ]

    def __str__(self):
        return (
            f"Recommandation - "
            f"{self.job.title} - "
            f"{self.resume.title} - "
            f"{self.score:.0f}/100"
        )
