from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import UserProfile


User = get_user_model()


class AccountAPITests(APITestCase):
    def test_register_creates_user_and_profile(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "newcareeruser",
                "email": "new@careerai.local",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        user = User.objects.get(
            username="newcareeruser"
        )

        self.assertTrue(
            UserProfile.objects.filter(
                user=user
            ).exists()
        )

    def test_register_rejects_short_password(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "username": "shortpassword",
                "email": "short@careerai.local",
                "password": "123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            User.objects.filter(
                username="shortpassword"
            ).exists()
        )

    def test_profile_requires_authentication(self):
        response = self.client.get(
            "/api/accounts/me/"
        )

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_read_profile(self):
        user = User.objects.create_user(
            username="profileuser",
            email="profile@careerai.local",
            password="StrongPass123!",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(
            "/api/accounts/me/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["username"],
            "profileuser",
        )
        self.assertEqual(
            response.data["email"],
            "profile@careerai.local",
        )

    def test_user_can_update_own_profile(self):
        user = User.objects.create_user(
            username="updateprofile",
            password="StrongPass123!",
        )

        self.client.force_authenticate(user=user)

        response = self.client.put(
            "/api/accounts/me/",
            {
                "city": "Paris",
                "target_role": "Data Engineer",
                "bio": "Profil CareerAI de test",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["city"],
            "Paris",
        )
        self.assertEqual(
            response.data["target_role"],
            "Data Engineer",
        )

        profile = UserProfile.objects.get(
            user=user
        )

        self.assertEqual(profile.city, "Paris")
