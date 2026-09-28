from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Resume


User = get_user_model()


class ResumeSecurityTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="resume_user_a",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="resume_user_b",
            password="StrongPass123!",
        )

        self.resume_a = Resume.objects.create(
            user=self.user_a,
            title="CV privé utilisateur A",
            extracted_text="Python Django SQL",
        )

    def test_resume_list_requires_authentication(self):
        response = self.client.get("/api/cvs/")
        self.assertEqual(response.status_code, 401)

    def test_user_only_sees_own_resumes(self):
        Resume.objects.create(
            user=self.user_b,
            title="CV utilisateur B",
        )

        self.client.force_authenticate(user=self.user_a)

        response = self.client.get("/api/cvs/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.resume_a.id,
        )

    def test_user_cannot_access_another_users_resume(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(
            f"/api/cvs/{self.resume_a.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_user_cannot_delete_another_users_resume(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.delete(
            f"/api/cvs/{self.resume_a.id}/"
        )

        self.assertEqual(response.status_code, 404)
        self.assertTrue(
            Resume.objects.filter(
                id=self.resume_a.id
            ).exists()
        )


class SkillsExtractionV3Tests(APITestCase):
    def test_detects_existing_skills(self):
        from .services import extract_skills

        text = """
        Développement Python et Django.
        Manipulation de données avec SQL et Excel.
        Utilisation de Git et Docker.
        """

        skills = extract_skills(text)

        self.assertIn("Python", skills)
        self.assertIn("Django", skills)
        self.assertIn("SQL", skills)
        self.assertIn("Excel", skills)
        self.assertIn("Git", skills)
        self.assertIn("Docker", skills)

    def test_detects_data_skills(self):
        from .services import extract_skills

        text = """
        Analyse de données avec Pandas et NumPy.
        Création de dashboards Power BI et Tableau.
        Pipelines ETL avec Apache Spark et Airflow.
        PostgreSQL pour le stockage des données.
        """

        skills = extract_skills(text)

        self.assertIn("Pandas", skills)
        self.assertIn("NumPy", skills)
        self.assertIn("Power BI", skills)
        self.assertIn("Tableau", skills)
        self.assertIn("ETL", skills)
        self.assertIn("Apache Spark", skills)
        self.assertIn("Airflow", skills)
        self.assertIn("PostgreSQL", skills)

    def test_detects_aliases_using_canonical_names(self):
        from .services import extract_skills

        text = """
        Expérience avec Postgres, PowerBI, DRF,
        JS, REST API et GitLab.
        """

        skills = extract_skills(text)

        self.assertIn("PostgreSQL", skills)
        self.assertIn("Power BI", skills)
        self.assertIn(
            "Django REST Framework",
            skills,
        )
        self.assertIn("JavaScript", skills)
        self.assertIn("API REST", skills)
        self.assertIn("GitLab", skills)

        self.assertNotIn("Postgres", skills)
        self.assertNotIn("PowerBI", skills)
        self.assertNotIn("DRF", skills)
        self.assertNotIn("JS", skills)

    def test_detects_cloud_and_ai_skills(self):
        from .services import extract_skills

        text = """
        Déploiement sur AWS et Azure.
        Mise en place de CI/CD.
        Projets de Machine Learning avec
        scikit-learn et PyTorch.
        Utilisation de LLM et IA générative.
        """

        skills = extract_skills(text)

        self.assertIn("AWS", skills)
        self.assertIn("Azure", skills)
        self.assertIn("CI/CD", skills)
        self.assertIn("Machine Learning", skills)
        self.assertIn("Scikit-learn", skills)
        self.assertIn("PyTorch", skills)
        self.assertIn("LLM", skills)
        self.assertIn("IA générative", skills)

    def test_does_not_duplicate_canonical_skill(self):
        from .services import extract_skills

        text = """
        Django REST Framework, DRF,
        Django REST framework et DRF.
        """

        skills = extract_skills(text)

        self.assertEqual(
            skills.count("Django REST Framework"),
            1,
        )

    def test_does_not_detect_c_from_normal_words(self):
        from .services import extract_skills

        text = """
        Nous recherchons une personne avec une bonne
        capacité de communication et un excellent
        esprit d'équipe.
        """

        skills = extract_skills(text)

        self.assertNotIn("C", skills)

    def test_empty_text_returns_empty_list(self):
        from .services import extract_skills

        self.assertEqual(extract_skills(""), [])
        self.assertEqual(extract_skills(None), [])


class SkillsExtractionFalsePositiveTests(APITestCase):
    def test_excel_is_not_detected_inside_excellent(self):
        from .services import extract_skills

        text = """
        Nous recherchons un excellent candidat
        avec un excellent esprit d'équipe.
        """

        skills = extract_skills(text)

        self.assertNotIn("Excel", skills)

    def test_excel_is_detected_when_explicit(self):
        from .services import extract_skills

        text = """
        Maîtrise d'Excel requise pour analyser
        et structurer les données.
        """

        skills = extract_skills(text)

        self.assertIn("Excel", skills)


class SkillsExtractionV2ExtendedTests(APITestCase):
    def test_detects_bi_and_analytics_skills(self):
        from .services import extract_skills

        text = """
        Analyse avec SAS, Excel, Power Query et DAX.
        Création de tableaux de bord avec Power BI,
        Looker et Qlik Sense.
        """

        skills = extract_skills(text)

        self.assertIn("SAS", skills)
        self.assertIn("Excel", skills)
        self.assertIn("Power Query", skills)
        self.assertIn("DAX", skills)
        self.assertIn("Power BI", skills)
        self.assertIn("Looker", skills)
        self.assertIn("Qlik", skills)

    def test_detects_modern_data_stack(self):
        from .services import extract_skills

        text = """
        Pipelines avec Talend, dbt et Airflow.
        Data warehouse Snowflake et BigQuery.
        Traitements Databricks, Spark, Kafka et Hadoop.
        """

        skills = extract_skills(text)

        self.assertIn("Talend", skills)
        self.assertIn("dbt", skills)
        self.assertIn("Airflow", skills)
        self.assertIn("Snowflake", skills)
        self.assertIn("BigQuery", skills)
        self.assertIn("Databricks", skills)
        self.assertIn("Apache Spark", skills)
        self.assertIn("Kafka", skills)
        self.assertIn("Hadoop", skills)

    def test_detects_database_skills(self):
        from .services import extract_skills

        text = """
        Bases Oracle Database, Microsoft SQL Server,
        PostgreSQL, MySQL et SQLite.
        """

        skills = extract_skills(text)

        self.assertIn("Oracle", skills)
        self.assertIn("SQL Server", skills)
        self.assertIn("PostgreSQL", skills)
        self.assertIn("MySQL", skills)
        self.assertIn("SQLite", skills)

    def test_detects_vba_alias(self):
        from .services import extract_skills

        text = """
        Automatisation Excel avec
        Visual Basic for Applications.
        """

        skills = extract_skills(text)

        self.assertIn("VBA", skills)

    def test_does_not_detect_sas_inside_words(self):
        from .services import extract_skills

        text = """
        Les utilisateurs saisissent leurs informations
        et les transmettent au service concerné.
        """

        skills = extract_skills(text)

        self.assertNotIn("SAS", skills)

    def test_does_not_detect_dax_inside_words(self):
        from .services import extract_skills

        text = """
        Le candidat devra adapter les documents
        aux besoins de l'entreprise.
        """

        skills = extract_skills(text)

        self.assertNotIn("DAX", skills)
