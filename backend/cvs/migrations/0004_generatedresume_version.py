from django.db import migrations, models


def assign_resume_versions(apps, schema_editor):
    GeneratedResume = apps.get_model(
        "cvs",
        "GeneratedResume",
    )

    groups = (
        GeneratedResume.objects
        .values_list("user_id", "analysis_id")
        .distinct()
    )

    for user_id, analysis_id in groups:
        resumes = (
            GeneratedResume.objects
            .filter(
                user_id=user_id,
                analysis_id=analysis_id,
            )
            .order_by("created_at", "id")
        )

        for version, resume in enumerate(
            resumes,
            start=1,
        ):
            resume.version = version
            resume.save(update_fields=["version"])


class Migration(migrations.Migration):

    dependencies = [
        ("cvs", "0003_generatedresume"),
    ]

    operations = [
        migrations.AddField(
            model_name="generatedresume",
            name="version",
            field=models.PositiveIntegerField(
                default=1,
            ),
        ),
        migrations.RunPython(
            assign_resume_versions,
            migrations.RunPython.noop,
        ),
        migrations.AddConstraint(
            model_name="generatedresume",
            constraint=models.UniqueConstraint(
                fields=[
                    "user",
                    "analysis",
                    "version",
                ],
                name="unique_generated_resume_version",
            ),
        ),
    ]
