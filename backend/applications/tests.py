from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from jobs.models import Job
from .models import Application


User = get_user_model()


class ApplicationSecurityTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="application_user_a",
            password="StrongPass123!",
        )
        self.user_b = User.objects.create_user(
            username="application_user_b",
            password="StrongPass123!",
        )

        self.job_a = Job.objects.create(
            user=self.user_a,
            company="Entreprise A",
            title="Data Analyst",
            description="Offre A",
        )

        self.job_b = Job.objects.create(
            user=self.user_b,
            company="Entreprise B",
            title="Data Engineer",
            description="Offre B",
        )

        self.application_a = Application.objects.create(
            user=self.user_a,
            job=self.job_a,
            status="sent",
        )

    def test_application_list_requires_authentication(self):
        response = self.client.get(
            "/api/applications/"
        )
        self.assertEqual(response.status_code, 401)

    def test_user_only_sees_own_applications(self):
        Application.objects.create(
            user=self.user_b,
            job=self.job_b,
        )

        self.client.force_authenticate(user=self.user_a)

        response = self.client.get(
            "/api/applications/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.application_a.id,
        )

    def test_user_cannot_access_another_users_application(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.get(
            f"/api/applications/{self.application_a.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_user_cannot_update_another_users_application(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.patch(
            f"/api/applications/{self.application_a.id}/",
            {"status": "accepted"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

        self.application_a.refresh_from_db()
        self.assertEqual(
            self.application_a.status,
            "sent",
        )

    def test_cannot_create_application_with_another_users_job(self):
        self.client.force_authenticate(user=self.user_b)

        response = self.client.post(
            "/api/applications/",
            {
                "job": self.job_a.id,
                "status": "draft",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            Application.objects.filter(
                user=self.user_b,
                job=self.job_a,
            ).count(),
            0,
        )
