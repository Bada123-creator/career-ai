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
            "coverage_score": 100.0,
            "confidence_level": "high",
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
        self.assertEqual(
            analysis.coverage_score,
            100.0,
        )
        self.assertEqual(
            analysis.confidence_level,
            "high",
        )
        self.assertTrue(
            analysis.ai_available
        )


class ScoringV2Tests(APITestCase):
    def test_overall_score_with_full_coverage(self):
        from ai_tools.services import calculate_scoring_summary

        result = calculate_scoring_summary({
            "skill_score": 80,
            "experience_score": 60,
            "education_score": 100,
        })

        self.assertEqual(result["overall_score"], 78.0)
        self.assertEqual(result["coverage_score"], 100.0)
        self.assertEqual(result["confidence_level"], "high")

    def test_partial_analysis_reports_low_coverage(self):
        from ai_tools.services import calculate_scoring_summary

        result = calculate_scoring_summary({
            "skill_score": None,
            "experience_score": 100,
            "education_score": None,
        })

        self.assertEqual(result["overall_score"], 25.0)
        self.assertEqual(result["coverage_score"], 25.0)
        self.assertEqual(result["confidence_level"], "low")

    def test_medium_coverage(self):
        from ai_tools.services import calculate_scoring_summary

        result = calculate_scoring_summary({
            "skill_score": 70,
            "experience_score": 80,
            "education_score": None,
        })

        self.assertEqual(result["coverage_score"], 85.0)
        self.assertEqual(result["confidence_level"], "high")

    def test_no_evaluable_dimension(self):
        from ai_tools.services import calculate_scoring_summary

        result = calculate_scoring_summary({
            "skill_score": None,
            "experience_score": None,
            "education_score": None,
        })

        self.assertEqual(result["overall_score"], 0)
        self.assertEqual(result["coverage_score"], 0.0)
        self.assertEqual(result["confidence_level"], "low")


class AnalysisEngineV3Tests(APITestCase):
    def test_mission_skill_is_essential(self):
        from ai_tools.services import classify_job_skills

        result = classify_job_skills(
            "Automatiser certaines tâches avec Python.",
            ["Python"],
        )

        self.assertEqual(
            result["essential"],
            ["Python"],
        )

    def test_database_requirement_is_essential(self):
        from ai_tools.services import classify_job_skills

        result = classify_job_skills(
            "Profil avec des connaissances en SQL.",
            ["SQL"],
        )

        self.assertEqual(
            result["essential"],
            ["SQL"],
        )

    def test_bonus_skill_remains_complementary(self):
        from ai_tools.services import classify_job_skills

        result = classify_job_skills(
            "Une connaissance de Django constitue un plus.",
            ["Django"],
        )

        self.assertEqual(
            result["essential"],
            [],
        )

        self.assertEqual(
            result["complementary"],
            ["Django"],
        )


    def test_classifies_explicit_required_skill_as_essential(self):
        from ai_tools.services import classify_job_skills

        text = """
        La maîtrise de Python est indispensable.
        Une connaissance de Power BI serait appréciée.
        """

        result = classify_job_skills(
            text,
            ["Python", "Power BI"],
        )

        self.assertIn(
            "Python",
            result["essential"],
        )
        self.assertIn(
            "Power BI",
            result["complementary"],
        )

    def test_essential_skill_has_more_weight(self):
        from ai_tools.services import calculate_skill_score

        score, matching, missing = calculate_skill_score(
            resume_skills=["Excel"],
            job_skills=["Python", "Excel"],
            essential_skills=["Python"],
        )

        self.assertEqual(score, 33.33)
        self.assertEqual(matching, ["Excel"])
        self.assertEqual(missing, ["Python"])

    def test_matching_essential_skill_is_rewarded_more(self):
        from ai_tools.services import calculate_skill_score

        score, matching, missing = calculate_skill_score(
            resume_skills=["Python"],
            job_skills=["Python", "Excel"],
            essential_skills=["Python"],
        )

        self.assertEqual(score, 66.67)
        self.assertEqual(matching, ["Python"])
        self.assertEqual(missing, ["Excel"])

    def test_no_classification_preserves_equal_weighting(self):
        from ai_tools.services import calculate_skill_score

        score, _, _ = calculate_skill_score(
            resume_skills=["Python"],
            job_skills=["Python", "Excel"],
        )

        self.assertEqual(score, 50.0)

    def test_empty_job_skills_remains_not_evaluable(self):
        from ai_tools.services import calculate_skill_score

        score, matching, missing = calculate_skill_score(
            resume_skills=["Python"],
            job_skills=[],
            essential_skills=[],
        )

        self.assertIsNone(score)
        self.assertEqual(matching, [])
        self.assertEqual(missing, [])



class AnalysisPersistenceV32Tests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        from cvs.models import Resume
        from jobs.models import Job

        User = get_user_model()

        self.user = User.objects.create_user(
            username="v32-user",
            password="test-password-v32",
        )

        self.resume = Resume.objects.create(
            user=self.user,
            title="CV V3.2",
            extracted_text=(
                "Python SQL Django API REST Git"
            ),
            skills=(
                "Python, SQL, Django, API REST, Git"
            ),
        )

        self.job = Job.objects.create(
            user=self.user,
            company="DataNova Test",
            title="Data Analyst Junior",
            description=(
                "Automatiser les traitements avec Python. "
                "Interroger les bases de données avec SQL. "
                "Réaliser des reportings avec Excel. "
                "Concevoir des tableaux de bord avec Power BI. "
                "Une connaissance de Django constitue un plus."
            ),
        )

        self.client.force_authenticate(
            user=self.user
        )

    def test_match_persists_skill_classification(self):
        from ai_tools.models import Analysis

        response = self.client.post(
            "/api/ai/match/",
            {
                "resume_id": self.resume.id,
                "job_id": self.job.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        analysis = Analysis.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            analysis.essential_skills,
            [
                "Python",
                "SQL",
                "Excel",
                "Power BI",
            ],
        )

        self.assertEqual(
            analysis.complementary_skills,
            ["Django"],
        )

    def test_analysis_api_exposes_skill_classification(self):
        from ai_tools.models import Analysis

        analysis = Analysis.objects.create(
            user=self.user,
            resume=self.resume,
            job=self.job,
            overall_score=70,
            coverage_score=60,
            confidence_level="medium",
            skill_score=65,
            matching_skills=[
                "Python",
                "SQL",
                "Django",
            ],
            missing_skills=[
                "Excel",
                "Power BI",
            ],
            essential_skills=[
                "Python",
                "SQL",
                "Excel",
                "Power BI",
            ],
            complementary_skills=[
                "Django",
            ],
        )

        response = self.client.get(
            f"/api/ai/analyses/{analysis.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        matching = response.data["matching"]

        self.assertEqual(
            matching["essential_skills"],
            [
                "Python",
                "SQL",
                "Excel",
                "Power BI",
            ],
        )

        self.assertEqual(
            matching["complementary_skills"],
            ["Django"],
        )


class MatchingEngineV2Tests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        from cvs.models import Resume
        from jobs.models import Job

        User = get_user_model()

        self.user = User.objects.create_user(
            username="matching-v2-user",
            password="test-password",
        )

        self.resume = Resume.objects.create(
            user=self.user,
            title="CV Matching V2",
            extracted_text=(
                "Python SQL Power BI Licence MIAGE "
                "Développement informatique"
            ),
            skills="Python, SQL, Power BI",
            experience=(
                "Mai 2026 – Juil. 2026 | "
                "Stagiaire Data / Qualité des données"
            ),
            education=(
                "2024–2026 | Université Paris Nanterre\n"
                "Licence MIASHS, parcours MIAGE – Diplôme validé"
            ),
        )

    def test_experience_does_not_use_whole_cv(self):
        from ai_tools.services import calculate_experience_score
        from jobs.models import Job

        job = Job.objects.create(
            user=self.user,
            company="Test",
            title="Data Analyst",
            description=(
                "Analyser les données avec Python, SQL "
                "et créer des tableaux de bord Power BI."
            ),
        )

        score = calculate_experience_score(
            self.resume,
            job,
        )

        # Python, SQL et Power BI présents ailleurs dans le CV
        # ne doivent pas devenir automatiquement des preuves
        # d'expérience.
        self.assertLess(score, 100.0)

    def test_licence_matches_bac3(self):
        from ai_tools.services import calculate_education_score
        from jobs.models import Job

        job = Job.objects.create(
            user=self.user,
            company="Test",
            title="Data Analyst",
            description="Formation Bac+3 minimum.",
        )

        score = calculate_education_score(
            self.resume,
            job,
        )

        self.assertEqual(score, 100.0)

    def test_licence_does_not_fully_match_bac5(self):
        from ai_tools.services import calculate_education_score
        from jobs.models import Job

        job = Job.objects.create(
            user=self.user,
            company="Test",
            title="Data Analyst",
            description="Formation Bac+5 / Master requise.",
        )

        score = calculate_education_score(
            self.resume,
            job,
        )

        self.assertEqual(score, 25.0)

    def test_future_engineering_studies_are_not_inferred(self):
        from ai_tools.services import calculate_education_score
        from jobs.models import Job

        self.resume.extracted_text += (
            "\n2026–2027 ESIEE Paris "
            "Cycle Ingénieur admission conditionnée"
        )
        self.resume.save()

        job = Job.objects.create(
            user=self.user,
            company="Test",
            title="Data Analyst",
            description="Diplôme d'ingénieur requis.",
        )

        score = calculate_education_score(
            self.resume,
            job,
        )

        self.assertEqual(score, 25.0)


class JobMatchPreviewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="preview_user",
            password="StrongPass123!",
        )

        self.other_user = User.objects.create_user(
            username="preview_other_user",
            password="StrongPass123!",
        )

        self.resume = Resume.objects.create(
            user=self.user,
            title="CV Data",
            extracted_text="Python SQL Django",
            skills="Python, SQL, Django",
        )

        self.other_resume = Resume.objects.create(
            user=self.other_user,
            title="CV autre utilisateur",
            extracted_text="Java",
            skills="Java",
        )

        self.client.force_authenticate(
            user=self.user
        )

    def test_preview_returns_expected_skill_score(self):
        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.resume.id,
                "jobs": [
                    {
                        "external_id": "job-1",
                        "title": "Data Analyst",
                        "description": (
                            "Maîtrise de Python et SQL obligatoire. "
                            "Power BI serait un plus."
                        ),
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["basis"],
            "skills_only",
        )

        preview = response.data["previews"][0]

        self.assertEqual(
            preview["external_id"],
            "job-1",
        )
        self.assertEqual(
            preview["score"],
            80.0,
        )
        self.assertEqual(
            preview["matching_skills"],
            ["Python", "SQL"],
        )
        self.assertEqual(
            preview["missing_skills"],
            ["Power BI"],
        )
        self.assertEqual(
            preview["essential_skills"],
            ["Python", "SQL"],
        )
        self.assertEqual(
            preview["complementary_skills"],
            ["Power BI"],
        )

    def test_preview_processes_multiple_jobs(self):
        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.resume.id,
                "jobs": [
                    {
                        "external_id": "job-python",
                        "title": "Python Developer",
                        "description": (
                            "Python obligatoire."
                        ),
                    },
                    {
                        "external_id": "job-java",
                        "title": "Java Developer",
                        "description": (
                            "Java obligatoire."
                        ),
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(
            len(response.data["previews"]),
            2,
        )

    def test_preview_rejects_empty_jobs(self):
        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.resume.id,
                "jobs": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_preview_rejects_more_than_twenty_jobs(self):
        jobs = [
            {
                "external_id": f"job-{index}",
                "title": "Data Analyst",
                "description": "Python SQL",
            }
            for index in range(21)
        ]

        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.resume.id,
                "jobs": jobs,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_preview_rejects_another_users_resume(self):
        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.other_resume.id,
                "jobs": [
                    {
                        "external_id": "job-1",
                        "title": "Data Analyst",
                        "description": "Python SQL",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_preview_requires_authentication(self):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            "/api/ai/job-match-preview/",
            {
                "resume_id": self.resume.id,
                "jobs": [
                    {
                        "external_id": "job-1",
                        "title": "Data Analyst",
                        "description": "Python SQL",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)
