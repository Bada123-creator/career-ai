from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from cvs.models import Resume
from jobs.models import Job

from .models import Analysis


User = get_user_model()


class AnalysisSecurityTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="analysis_user_a",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="analysis_user_b",
            password="StrongPass123!",
        )

        self.resume_a = Resume.objects.create(
            user=self.user_a,
            title="CV utilisateur A",
            extracted_text="Python Django SQL",
            skills="Python, Django, SQL",
        )

        self.resume_b = Resume.objects.create(
            user=self.user_b,
            title="CV utilisateur B",
            extracted_text="Java Spring",
            skills="Java, Spring",
        )

        self.job_a = Job.objects.create(
            user=self.user_a,
            company="Entreprise A",
            title="Data Engineer",
            description="Python SQL Django",
        )

        self.job_b = Job.objects.create(
            user=self.user_b,
            company="Entreprise B",
            title="Java Developer",
            description="Java Spring",
        )

        self.analysis_a = Analysis.objects.create(
            user=self.user_a,
            resume=self.resume_a,
            job=self.job_a,
            overall_score=75,
        )

    def test_analysis_history_requires_authentication(self):
        response = self.client.get(
            "/api/ai/analyses/"
        )

        self.assertEqual(response.status_code, 401)

    def test_user_only_sees_own_analyses(self):
        Analysis.objects.create(
            user=self.user_b,
            resume=self.resume_b,
            job=self.job_b,
            overall_score=60,
        )

        self.client.force_authenticate(
            user=self.user_a
        )

        response = self.client.get(
            "/api/ai/analyses/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.analysis_a.id,
        )

    def test_user_cannot_access_another_users_analysis(self):
        self.client.force_authenticate(
            user=self.user_b
        )

        response = self.client.get(
            f"/api/ai/analyses/{self.analysis_a.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_match_requires_authentication(self):
        response = self.client.post(
            "/api/ai/match/",
            {
                "resume_id": self.resume_a.id,
                "job_id": self.job_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_match_rejects_another_users_resume(self):
        self.client.force_authenticate(
            user=self.user_b
        )

        response = self.client.post(
            "/api/ai/match/",
            {
                "resume_id": self.resume_a.id,
                "job_id": self.job_b.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_match_rejects_another_users_job(self):
        self.client.force_authenticate(
            user=self.user_b
        )

        response = self.client.post(
            "/api/ai/match/",
            {
                "resume_id": self.resume_b.id,
                "job_id": self.job_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    @patch(
        "ai_tools.views.analyze_resume_with_ai"
    )
    @patch(
        "ai_tools.views.match_resume_to_job"
    )
    def test_authenticated_user_can_create_analysis(
        self,
        mock_match,
        mock_ai,
    ):
        mock_match.return_value = {
            "overall_score": 82,
            "skill_score": 85,
            "experience_score": 80,
            "education_score": 78,
            "matching_skills": [
                "Python",
                "SQL",
            ],
            "missing_skills": [
                "AWS",
            ],
        }

        mock_ai.return_value = {
            "summary": "Analyse CareerAI de test"
        }

        self.client.force_authenticate(
            user=self.user_a
        )

        response = self.client.post(
            "/api/ai/match/",
            {
                "resume_id": self.resume_a.id,
                "job_id": self.job_a.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        analysis = Analysis.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            analysis.user,
            self.user_a,
        )
        self.assertEqual(
            analysis.resume,
            self.resume_a,
        )
        self.assertEqual(
            analysis.job,
            self.job_a,
        )
        self.assertEqual(
            analysis.overall_score,
            82,
        )
        self.assertTrue(
            analysis.ai_available
        )
