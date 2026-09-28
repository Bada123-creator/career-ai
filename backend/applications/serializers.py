from rest_framework import serializers

from ai_tools.models import Analysis
from jobs.models import Job

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(
        source="job.title",
        read_only=True,
    )
    company = serializers.CharField(
        source="job.company",
        read_only=True,
    )
    location = serializers.CharField(
        source="job.location",
        read_only=True,
    )
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    analysis_score = serializers.FloatField(
        source="analysis.overall_score",
        read_only=True,
        allow_null=True,
    )

    generated_resume_version = serializers.IntegerField(
        source="generated_resume.version",
        read_only=True,
        allow_null=True,
    )

    generated_resume_title = serializers.CharField(
        source="generated_resume.title",
        read_only=True,
        allow_null=True,
    )

    has_generated_resume = serializers.SerializerMethodField()
    has_cover_letter = serializers.SerializerMethodField()
    has_interview_preparation = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "job",
            "job_title",
            "company",
            "location",
            "analysis",
            "analysis_score",
            "generated_resume",
            "generated_resume_version",
            "generated_resume_title",
            "has_generated_resume",
            "has_cover_letter",
            "has_interview_preparation",
            "status",
            "status_display",
            "notes",
            "applied_at",
            "follow_up_at",
            "next_action",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "job_title",
            "company",
            "location",
            "analysis_score",
            "generated_resume_version",
            "generated_resume_title",
            "has_generated_resume",
            "has_cover_letter",
            "has_interview_preparation",
            "status_display",
            "created_at",
            "updated_at",
        ]

    def validate_job(self, job: Job):
        request = self.context.get("request")

        if request and job.user_id != request.user.id:
            raise serializers.ValidationError(
                "Cette offre ne vous appartient pas."
            )

        return job

    def validate_generated_resume(self, generated_resume):
        if generated_resume is None:
            return None

        request = self.context.get("request")

        if (
            request
            and generated_resume.user_id
            != request.user.id
        ):
            raise serializers.ValidationError(
                "Ce CV ne vous appartient pas."
            )

        return generated_resume

    def validate_analysis(self, analysis: Analysis):
        request = self.context.get("request")

        if request and analysis.user_id != request.user.id:
            raise serializers.ValidationError(
                "Cette analyse ne vous appartient pas."
            )

        return analysis

    def validate(self, attrs):
        attrs = super().validate(attrs)

        job = attrs.get(
            "job",
            getattr(self.instance, "job", None),
        )
        analysis = attrs.get(
            "analysis",
            getattr(self.instance, "analysis", None),
        )

        if (
            analysis is not None
            and job is not None
            and analysis.job_id != job.id
        ):
            raise serializers.ValidationError(
                {
                    "analysis": (
                        "Cette analyse ne correspond pas "
                        "à l'offre de cette candidature."
                    )
                }
            )

        generated_resume = attrs.get(
            "generated_resume",
            getattr(
                self.instance,
                "generated_resume",
                None,
            ),
        )

        if (
            generated_resume is not None
            and analysis is None
        ):
            raise serializers.ValidationError(
                {
                    "generated_resume": (
                        "Une analyse est nécessaire "
                        "pour sélectionner ce CV."
                    )
                }
            )

        if (
            generated_resume is not None
            and analysis is not None
            and generated_resume.analysis_id
            != analysis.id
        ):
            raise serializers.ValidationError(
                {
                    "generated_resume": (
                        "Ce CV ne correspond pas "
                        "à l'analyse de cette candidature."
                    )
                }
            )

        return attrs

    def get_has_generated_resume(self, obj):
        if not obj.analysis_id:
            return False

        return obj.analysis.generated_resumes.exists()

    def get_has_cover_letter(self, obj):
        if not obj.analysis_id:
            return False

        return obj.analysis.cover_letters.exists()

    def get_has_interview_preparation(self, obj):
        if not obj.analysis_id:
            return False

        return obj.analysis.interview_preparations.exists()
