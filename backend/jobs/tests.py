from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Job


User = get_user_model()


class JobSecurityTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="job_user_a",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="job_user_b",
            password="StrongPass123!",
        )

        self.job_a = Job.objects.create(
            user=self.user_a,
            company="Entreprise A",
            title="Data Analyst",
            description="Offre privée utilisateur A",
            location="Paris",
        )

    def test_job_list_requires_authentication(self):
        response = self.client.get("/api/jobs/")
        self.assertEqual(response.status_code, 401)

    def test_user_only_sees_own_jobs(self):
        Job.objects.create(
            user=self.user_b,
            company="Entreprise B",
            title="Data Engineer",
            description="Offre utilisateur B",
        )

        self.client.force_authenticate(user=self.user_a)

        response = self.client.get("/api/jobs/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.job_a.id,
        )

    def test_user_cannot_access_another_users_job(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(
            f"/api/jobs/{self.job_a.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_user_cannot_delete_another_users_job(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.delete(
            f"/api/jobs/{self.job_a.id}/"
        )

        self.assertEqual(response.status_code, 404)
        self.assertTrue(
            Job.objects.filter(
                id=self.job_a.id
            ).exists()
        )


from unittest.mock import patch


class JobDescriptionEnrichmentTests(APITestCase):
    def test_keeps_existing_long_description(self):
        from .job_enrichment_service import enrich_job_description

        description = "Data Analyst Python SQL. " * 100

        result = enrich_job_description(
            description=description,
            source_url="https://example.com/job",
        )

        self.assertEqual(
            result["description"],
            description,
        )
        self.assertFalse(result["enriched"])
        self.assertEqual(
            result["source"],
            "existing",
        )

    def test_short_description_without_url_uses_fallback(self):
        from .job_enrichment_service import enrich_job_description

        description = "Courte description."

        result = enrich_job_description(
            description=description,
            source_url="",
        )

        self.assertEqual(
            result["description"],
            description,
        )
        self.assertFalse(result["enriched"])
        self.assertEqual(
            result["source"],
            "fallback",
        )

    @patch(
        "jobs.job_enrichment_service.extract_job_page_text"
    )
    def test_short_description_is_enriched_from_page(
        self,
        mock_extract,
    ):
        from .job_enrichment_service import enrich_job_description

        mock_extract.return_value = {
            "source_url": "https://company.com/job",
            "page_title": "Data Analyst",
            "meta_description": "",
            "text": (
                "Nous recrutons un Data Analyst. "
                "Python SQL Power BI Pandas. "
                * 100
            ),
        }

        result = enrich_job_description(
            description="Résumé Adzuna.",
            source_url="https://adzuna.example/job",
        )

        self.assertTrue(result["enriched"])
        self.assertEqual(
            result["source"],
            "page",
        )
        self.assertIn(
            "Python SQL Power BI Pandas",
            result["description"],
        )

    @patch(
        "jobs.job_enrichment_service.extract_job_page_text"
    )
    def test_network_failure_keeps_original_description(
        self,
        mock_extract,
    ):
        from .job_enrichment_service import enrich_job_description
        from .job_import_service import JobImportError

        mock_extract.side_effect = JobImportError(
            "Page inaccessible."
        )

        description = "Résumé Adzuna."

        result = enrich_job_description(
            description=description,
            source_url="https://example.com/job",
        )

        self.assertEqual(
            result["description"],
            description,
        )
        self.assertFalse(result["enriched"])
        self.assertEqual(
            result["source"],
            "fallback",
        )


class JobCreateEnrichmentIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="job_enrichment_user",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    @patch("jobs.views.enrich_job_description")
    def test_create_job_uses_enriched_description(
        self,
        mock_enrich,
    ):
        mock_enrich.return_value = {
            "description": (
                "Description complète Python SQL Power BI."
            ),
            "enriched": True,
            "source": "page",
            "source_url": "https://company.com/job",
        }

        response = self.client.post(
            "/api/jobs/",
            {
                "company": "Entreprise Test",
                "title": "Data Analyst",
                "description": "Résumé court.",
                "location": "Paris",
                "source_url": "https://example.com/job",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        job = Job.objects.get(id=response.data["id"])

        self.assertEqual(
            job.description,
            "Description complète Python SQL Power BI.",
        )
        self.assertEqual(
            job.source_url,
            "https://company.com/job",
        )

    @patch("jobs.views.enrich_job_description")
    def test_create_job_keeps_fallback_description(
        self,
        mock_enrich,
    ):
        mock_enrich.return_value = {
            "description": "Résumé Adzuna.",
            "enriched": False,
            "source": "fallback",
            "source_url": "https://example.com/job",
        }

        response = self.client.post(
            "/api/jobs/",
            {
                "company": "Entreprise Test",
                "title": "Data Analyst",
                "description": "Résumé Adzuna.",
                "location": "Paris",
                "source_url": "https://example.com/job",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        job = Job.objects.get(id=response.data["id"])

        self.assertEqual(
            job.description,
            "Résumé Adzuna.",
        )


class JobCreateEnrichmentResilienceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="job_resilience_user",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    @patch("jobs.views.enrich_job_description")
    def test_enrichment_failure_does_not_block_job_creation(
        self,
        mock_enrich,
    ):
        mock_enrich.side_effect = RuntimeError(
            "Erreur externe inattendue"
        )

        response = self.client.post(
            "/api/jobs/",
            {
                "company": "Entreprise Résilience",
                "title": "Data Analyst",
                "description": "Description originale.",
                "location": "Paris",
                "source_url": "https://example.com/job",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        job = Job.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            job.description,
            "Description originale.",
        )

        self.assertEqual(
            job.source_url,
            "https://example.com/job",
        )
