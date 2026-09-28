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
