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


class JobSearchV2Tests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="job_search_v2_user",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)

    @patch("jobs.job_search_service.requests.get")
    def test_search_forwards_filters_to_adzuna(
        self,
        mock_get,
    ):
        mock_response = mock_get.return_value
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "count": 1,
            "results": [
                {
                    "id": "123",
                    "title": "Data Analyst Alternance",
                    "company": {
                        "display_name": "CareerAI Test"
                    },
                    "location": {
                        "display_name": "Paris"
                    },
                    "description": "Python SQL",
                    "redirect_url": "https://example.com/job/123",
                    "created": "2026-09-29T08:00:00Z",
                }
            ],
        }

        response = self.client.get(
            "/api/jobs/search/",
            {
                "query": "Data Analyst",
                "location": "Paris",
                "contract_type": "alternance",
                "sort_by": "relevance",
                "page": 2,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["page"], 2)
        self.assertEqual(
            response.data["contract_type"],
            "alternance",
        )
        self.assertEqual(
            response.data["sort_by"],
            "relevance",
        )

        _, kwargs = mock_get.call_args
        params = kwargs["params"]

        self.assertEqual(
            params["what"],
            "Data Analyst alternance",
        )
        self.assertEqual(params["where"], "Paris")
        self.assertEqual(
            params["sort_by"],
            "relevance",
        )

    @patch("jobs.job_search_service.requests.get")
    def test_search_normalizes_external_job(
        self,
        mock_get,
    ):
        mock_response = mock_get.return_value
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "count": 1,
            "results": [
                {
                    "id": 456,
                    "title": "Data Engineer",
                    "company": {
                        "display_name": "Entreprise Test"
                    },
                    "location": {
                        "display_name": "Lyon"
                    },
                    "description": "Python et SQL.",
                    "redirect_url": "https://example.com/job/456",
                    "created": "2026-09-29T09:00:00Z",
                }
            ],
        }

        response = self.client.get(
            "/api/jobs/search/",
            {
                "query": "Data Engineer",
            },
        )

        self.assertEqual(response.status_code, 200)

        job = response.data["results"][0]

        self.assertEqual(job["external_id"], "456")
        self.assertEqual(job["title"], "Data Engineer")
        self.assertEqual(
            job["company"],
            "Entreprise Test",
        )
        self.assertEqual(job["location"], "Lyon")
        self.assertEqual(
            job["source_url"],
            "https://example.com/job/456",
        )

    def test_search_rejects_invalid_contract(self):
        response = self.client.get(
            "/api/jobs/search/",
            {
                "query": "Data Analyst",
                "contract_type": "freelance-invalid",
            },
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(
            response.data["detail"],
            "Type de contrat invalide.",
        )

    def test_search_rejects_invalid_sort(self):
        response = self.client.get(
            "/api/jobs/search/",
            {
                "query": "Data Analyst",
                "sort_by": "unknown",
            },
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(
            response.data["detail"],
            "Type de tri invalide.",
        )


class ContractDetectionTests(APITestCase):
    def test_detects_alternance(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Data Analyst H/F en alternance",
                "",
            ),
            "alternance",
        )

    def test_detects_apprentissage_as_alternance(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Data Engineer",
                "Contrat d'apprentissage de 24 mois.",
            ),
            "alternance",
        )

    def test_detects_stage(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Stage Data Analyst",
                "Stage de 6 mois.",
            ),
            "stage",
        )

    def test_detects_cdi(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Data Engineer CDI",
                "Poste basé à Paris.",
            ),
            "cdi",
        )

    def test_detects_cdd(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Data Analyst CDD",
                "Mission de 12 mois.",
            ),
            "cdd",
        )

    def test_returns_unknown_when_contract_is_missing(self):
        from .job_search_service import detect_contract_type

        self.assertEqual(
            detect_contract_type(
                "Data Analyst",
                "Python SQL Power BI.",
            ),
            "unknown",
        )
