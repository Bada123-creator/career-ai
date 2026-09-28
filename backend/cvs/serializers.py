from pypdf import PdfReader
from rest_framework import serializers

from .models import Resume
from .services import (
    extract_skills,
    extract_education,
    extract_experience,
)


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "title",
            "file",
            "extracted_text",
            "skills",
            "education",
            "experience",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "extracted_text",
            "skills",
            "education",
            "experience",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        resume = Resume.objects.create(**validated_data)

        if resume.file:
            try:
                reader = PdfReader(resume.file.path)

                pages_text = []

                for page in reader.pages:
                    text = page.extract_text()

                    if text:
                        pages_text.append(text)

                extracted_text = "\n".join(pages_text)

                skills = extract_skills(extracted_text)
                education = extract_education(extracted_text)
                experience = extract_experience(extracted_text)

                resume.extracted_text = extracted_text
                resume.skills = ", ".join(skills)
                resume.education = "\n".join(education)
                resume.experience = "\n".join(experience)

                resume.save(
                    update_fields=[
                        "extracted_text",
                        "skills",
                        "education",
                        "experience",
                    ]
                )

            except Exception as exc:
                resume.extracted_text = (
                    f"Erreur lors de l'extraction du PDF : {exc}"
                )

                resume.save(
                    update_fields=["extracted_text"]
                )

        return resume
