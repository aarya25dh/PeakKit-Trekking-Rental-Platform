from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APIClient
from .models import Profile
import json


class UserRegistrationTestCase(TestCase):
    """Test cases for user registration."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('users:register')

    def test_successful_registration(self):
        """Test successful user registration."""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone_number': '9841234567',
            'password': 'SecurePass123!',
            'confirm_password': 'SecurePass123!',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.json())
        self.assertIn('refresh_token', response.json())
        self.assertTrue(User.objects.filter(email='john@example.com').exists())

    def test_registration_password_mismatch(self):
        """Test registration with mismatched passwords."""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone_number': '9841234567',
            'password': 'SecurePass123!',
            'confirm_password': 'DifferentPass123!',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='john@example.com').exists())

    def test_registration_weak_password(self):
        """Test registration with weak password."""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone_number': '9841234567',
            'password': 'weak',
            'confirm_password': 'weak',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_email(self):
        """Test registration with duplicate email."""
        User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='SecurePass123!'
        )
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'existing@example.com',
            'phone_number': '9841234567',
            'password': 'SecurePass123!',
            'confirm_password': 'SecurePass123!',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_phone(self):
        """Test registration with duplicate phone number."""
        user = User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='SecurePass123!'
        )
        user.profile.phone_number = '9841234567'
        user.profile.save()

        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone_number': '9841234567',
            'password': 'SecurePass123!',
            'confirm_password': 'SecurePass123!',
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTestCase(TestCase):
    """Test cases for user login."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse('users:login')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!',
            first_name='Test',
            last_name='User'
        )
        self.user.profile.phone_number = '9841234567'
        self.user.profile.save()

    def test_successful_login(self):
        """Test successful login."""
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.json())
        self.assertIn('refresh_token', response.json())

    def test_login_invalid_email(self):
        """Test login with invalid email."""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'SecurePass123!',
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_invalid_password(self):
        """Test login with invalid password."""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword123!',
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Check that failed login attempts are incremented
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.failed_login_attempts, 1)

    def test_login_account_locked_after_5_attempts(self):
        """Test that account is locked after 5 failed login attempts."""
        # Make 5 failed attempts
        for i in range(5):
            data = {
                'email': 'test@example.com',
                'password': 'WrongPassword123!',
            }
            response = self.client.post(self.login_url, data)

        # Check that account is locked
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.is_account_locked())
        self.assertEqual(self.user.profile.failed_login_attempts, 5)

        # Try to login with correct password
        data = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordStrengthTestCase(TestCase):
    """Test cases for password strength checker."""

    def setUp(self):
        self.client = APIClient()
        self.strength_url = reverse('users:password_strength')

    def test_weak_password_strength(self):
        """Test weak password."""
        data = {'password': 'weak'}
        response = self.client.post(self.strength_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('strength', response.json())
        self.assertEqual(response.json()['strength'], 'Weak')

    def test_strong_password_strength(self):
        """Test strong password."""
        data = {'password': 'SecurePass123!'}
        response = self.client.post(self.strength_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('strength', response.json())
        self.assertIn(response.json()['strength'], ['Strong', 'Very Strong'])

    def test_password_strength_suggestions(self):
        """Test that suggestions are provided."""
        data = {'password': 'weak'}
        response = self.client.post(self.strength_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestions', response.json())
        self.assertGreater(len(response.json()['suggestions']), 0)


class ForgotPasswordTestCase(TestCase):
    """Test cases for forgot password functionality."""

    def setUp(self):
        self.client = APIClient()
        self.forgot_url = reverse('users:forgot_password')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!'
        )

    def test_forgot_password_existing_email(self):
        """Test forgot password with existing email."""
        data = {'email': 'test@example.com'}
        response = self.client.post(self.forgot_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertIsNotNone(self.user.profile.password_reset_token)

    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with nonexistent email."""
        data = {'email': 'nonexistent@example.com'}
        response = self.client.post(self.forgot_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ResetPasswordTestCase(TestCase):
    """Test cases for password reset."""

    def setUp(self):
        self.client = APIClient()
        self.reset_url = reverse('users:reset_password')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!'
        )
        self.token = self.user.profile.generate_password_reset_token()

    def test_successful_password_reset(self):
        """Test successful password reset."""
        data = {
            'token': self.token,
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.reset_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try to login with new password
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass123!'))

    def test_password_reset_invalid_token(self):
        """Test password reset with invalid token."""
        data = {
            'token': 'invalid-token',
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.reset_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_expired_token(self):
        """Test password reset with expired token."""
        self.user.profile.password_reset_token_expires = timezone.now() - timedelta(minutes=20)
        self.user.profile.save()

        data = {
            'token': self.token,
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.reset_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailVerificationTestCase(TestCase):
    """Test cases for email verification."""

    def setUp(self):
        self.client = APIClient()
        self.send_verification_url = reverse('users:send_verification')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!'
        )
        self.token = self.user.profile.generate_email_verification_token()

    def test_verify_email_valid_token(self):
        """Test email verification with valid token."""
        verify_url = reverse('users:verify_email', kwargs={'token': self.token})
        response = self.client.get(verify_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.email_verified)

    def test_verify_email_invalid_token(self):
        """Test email verification with invalid token."""
        verify_url = reverse('users:verify_email', kwargs={'token': 'invalid-token'})
        response = self.client.get(verify_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_expired_token(self):
        """Test email verification with expired token."""
        self.user.profile.email_verification_token_expires = timezone.now() - timedelta(hours=25)
        self.user.profile.save()

        verify_url = reverse('users:verify_email', kwargs={'token': self.token})
        response = self.client.get(verify_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTestCase(TestCase):
    """Test cases for user profile endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = reverse('users:user_profile')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!',
            first_name='Test',
            last_name='User'
        )
        self.user.profile.phone_number = '9841234567'
        self.user.profile.address = '123 Main St'
        self.user.profile.city = 'Kathmandu'
        self.user.profile.province = 'Bagmati'
        self.user.profile.save()

    def test_get_user_profile_authenticated(self):
        """Test getting user profile when authenticated."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['phone_number'], '9841234567')

    def test_get_user_profile_unauthenticated(self):
        """Test getting user profile when not authenticated."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile(self):
        """Test updating user profile."""
        self.client.force_authenticate(user=self.user)
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'address': '456 Side St',
            'city': 'Pokhara',
            'province': 'Gandaki',
        }
        response = self.client.patch(self.profile_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')


class ChangePasswordTestCase(TestCase):
    """Test cases for change password functionality."""

    def setUp(self):
        self.client = APIClient()
        self.change_password_url = reverse('users:change_password')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!'
        )

    def test_change_password_successful(self):
        """Test successful password change."""
        self.client.force_authenticate(user=self.user)
        data = {
            'current_password': 'SecurePass123!',
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_password_incorrect_current(self):
        """Test change password with incorrect current password."""
        self.client.force_authenticate(user=self.user)
        data = {
            'current_password': 'WrongPassword123!',
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated(self):
        """Test change password when not authenticated."""
        data = {
            'current_password': 'SecurePass123!',
            'new_password': 'NewSecurePass123!',
            'confirm_password': 'NewSecurePass123!',
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTTokenTestCase(TestCase):
    """Test cases for JWT token functionality."""

    def setUp(self):
        self.client = APIClient()
        self.refresh_url = reverse('users:refresh_token')
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!'
        )
        from .tokens import CustomTokenGenerator
        self.tokens = CustomTokenGenerator.get_tokens_for_user(self.user)

    def test_refresh_token_valid(self):
        """Test refreshing token with valid refresh token."""
        data = {'refresh_token': self.tokens['refresh']}
        response = self.client.post(self.refresh_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.json())

    def test_refresh_token_invalid(self):
        """Test refreshing token with invalid refresh token."""
        data = {'refresh_token': 'invalid-token'}
        response = self.client.post(self.refresh_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_missing(self):
        """Test refreshing token without refresh token."""
        data = {}
        response = self.client.post(self.refresh_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
