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
