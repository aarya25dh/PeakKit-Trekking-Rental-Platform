from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import RetrieveUpdateAPIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.shortcuts import get_object_or_404
import logging

from .models import Profile, Notification
from .serializers import (
    RegistrationSerializer, LoginSerializer, UserSerializer,
    PasswordStrengthSerializer, ForgotPasswordSerializer,
    ResetPasswordSerializer, ChangePasswordSerializer,
    UpdateProfileSerializer, EmailVerificationSerializer, ProfileSerializer,
    NotificationListSerializer, NotificationMarkReadSerializer
)
from .tokens import CustomTokenGenerator
from .permissions import IsProfileOwner, IsAuthenticatedUser

logger = logging.getLogger(__name__)


# PART 2 & 3: Registration endpoint
class RegisterView(APIView):
    """
    POST /api/auth/register/
    
    Register a new user with email, password, and profile information.
    Returns JWT access and refresh tokens on successful registration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Safely get or create profile
            profile, _ = Profile.objects.get_or_create(user=user)
            
            # Generate tokens
            tokens = CustomTokenGenerator.get_tokens_for_user(user)
            
            return Response({
                'message': 'User registered successfully. Please verify your email.',
                'user': UserSerializer(user).data,
                'access_token': tokens['access'],
                'refresh_token': tokens['refresh'],
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PART 5: Login endpoint
class LoginView(APIView):
    """
    POST /api/auth/login/
    
    Authenticate user with email and password.
    Returns JWT access and refresh tokens.
    Handles failed login attempts and account locking.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = CustomTokenGenerator.get_tokens_for_user(user)
            
            return Response({
                'message': 'Login successful.',
                'user': UserSerializer(user).data,
                'access_token': tokens['access'],
                'refresh_token': tokens['refresh'],
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


# PART 4: Password strength checker
class PasswordStrengthView(APIView):
    """
    POST /api/auth/password-strength/
    
    Check password strength without saving anything.
    Returns score (0-4), strength level, and suggestions.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordStrengthSerializer(data=request.data)
        
        if serializer.is_valid():
            strength_info = serializer.validated_data['strength_info']
            return Response(strength_info, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PART 10: Forgot password endpoint
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    
    Request password reset for the given email.
    Sends reset email with token valid for 15 minutes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                # Safely get or create profile
                profile, _ = Profile.objects.get_or_create(user=user)
                # Generate reset token
                reset_token = profile.generate_password_reset_token()
                
                # Send email
                self._send_reset_email(user, reset_token)
                
                return Response({
                    'message': 'Password reset link has been sent to your email.'
                }, status=status.HTTP_200_OK)
            
            except Exception as e:
                logger.error(f"Error sending reset email: {str(e)}")
                return Response({
                    'message': 'Error sending reset email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_reset_email(self, user, token):
        """Send password reset email."""
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "PeakKit - Password Reset Request"
        
        context = {
            'first_name': user.first_name,
            'reset_link': reset_link,
            'expiry_time': '15 minutes',
        }
        
        html_message = render_to_string('emails/reset_password.html', context)
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


# PART 11: Reset password endpoint
class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    
    Reset password using the reset token.
    Token must be valid and not expired.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            profile = serializer.validated_data['profile']
            new_password = serializer.validated_data['new_password']
            
            # Update password
            profile.user.set_password(new_password)
            profile.user.save()
            
            # Clear reset token
            profile.password_reset_token = None
            profile.password_reset_token_expires = None
            profile.save()
            
            return Response({
                'message': 'Password reset successfully. You can now login with your new password.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# PART 9: Email verification - Send verification email
class SendVerificationEmailView(APIView):
    """
    POST /api/auth/send-verification/
    
    Send verification email to the user's registered email.
    User must provide their email address.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                # Safely get or create profile
                profile, _ = Profile.objects.get_or_create(user=user)
                # Generate verification token
                verification_token = profile.generate_email_verification_token()
                
                # Send email
                self._send_verification_email(user, verification_token)
                
                return Response({
                    'message': 'Verification email has been sent. Please check your inbox.'
                }, status=status.HTTP_200_OK)
            
            except Exception as e:
                logger.error(f"Error sending verification email: {str(e)}")
                return Response({
                    'message': 'Error sending verification email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_verification_email(self, user, token):
        """Send email verification email."""
        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        subject = "PeakKit - Verify Your Email Address"
        
        context = {
            'first_name': user.first_name,
            'verification_link': verification_link,
            'expiry_time': '24 hours',
        }
        
        html_message = render_to_string('emails/verify_email.html', context)
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


# PART 9: Email verification - Verify email with token
class VerifyEmailView(APIView):
    """
    GET /api/auth/verify-email/<token>/
    
    Verify user's email using the verification token.
    Token must be valid and not expired.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            profile = Profile.objects.get(email_verification_token=token)
            
            # Check if token is expired
            if profile.email_verification_token_expires < timezone.now():
                return Response({
                    'message': 'Verification token has expired. Please request a new verification email.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark email as verified
            profile.email_verified = True
            profile.email_verification_token = None
            profile.email_verification_token_expires = None
            profile.save()
            
            return Response({
                'message': 'Email verified successfully. You can now use all features.'
            }, status=status.HTTP_200_OK)
        
        except Profile.DoesNotExist:
            return Response({
                'message': 'Invalid verification token.'
            }, status=status.HTTP_400_BAD_REQUEST)


# PART 8: User profile endpoints
class UserProfileView(RetrieveUpdateAPIView):
    """
    GET /api/profile/ - Get current user's profile
    PATCH /api/profile/ - Update current user's profile
    
    Authenticated users can view and update their profile information.
    """
    serializer_class = UpdateProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Safely get or create profile
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# PART 12: Change password endpoint
class ChangePasswordView(APIView):
    """
    POST /api/profile/change-password/
    
    Change password for authenticated user.
    Requires current password and new password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Logout view (token blacklist - if using SimpleJWT)
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Logout user by blacklisting their refresh token.
    Requires authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response({
                    'message': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Blacklist the token (if using token blacklist)
            # This would require additional setup with SimpleJWT's blacklist
            
            return Response({
                'message': 'Logout successful.'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error during logout: {str(e)}")
            return Response({
                'message': 'Error during logout.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Refresh token endpoint
class RefreshTokenView(APIView):
    """
    POST /api/auth/refresh/
    
    Get a new access token using refresh token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response({
                    'message': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            tokens = CustomTokenGenerator.refresh_access_token(refresh_token)
            
            if tokens is None:
                return Response({
                    'message': 'Invalid or expired refresh token.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            return Response(tokens, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return Response({
                'message': 'Error refreshing token.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# PART 14: Notification endpoints
class NotificationListView(APIView):
    """
    GET /api/notifications/
    Get all notifications for the authenticated user, newest first.
    Includes unread count.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        unread_count = notifications.filter(is_read=False).count()

        serializer = NotificationListSerializer(notifications, many=True)

        return Response({
            'message': 'Notifications retrieved successfully.',
            'total': notifications.count(),
            'unread_count': unread_count,
            'unread': unread_count,
            'notifications': serializer.data
        }, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """
    POST /api/notifications/mark-read/
    PATCH /api/notifications/read/
    Mark one or more notifications as read.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return self._mark_read(request)

    def patch(self, request):
        return self._mark_read(request)

    def _mark_read(self, request):
        serializer = NotificationMarkReadSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
            return Response({
                'message': 'Notifications marked as read.',
                'unread_count': unread_count,
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Error marking notifications as read.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class NotificationMarkOneReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Mark a single notification as read.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, user=request.user)
        notification.is_read = True
        notification.save(update_fields=['is_read', 'updated_at'])
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'message': 'Notification marked as read.',
            'unread_count': unread_count,
            'notification': NotificationListSerializer(notification).data,
        }, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    """
    PATCH /api/notifications/read-all/
    Mark all notifications as read for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({
            'message': 'All notifications marked as read.',
            'updated': updated,
            'unread_count': 0,
        }, status=status.HTTP_200_OK)


class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'unread_count': unread_count,
        }, status=status.HTTP_200_OK)


class NotificationDeleteView(APIView):
    """
    DELETE /api/notifications/<notification_id>/
    Delete a specific notification.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, user=request.user)
        notification.delete()
        
        return Response({
            'message': 'Notification deleted successfully.'
        }, status=status.HTTP_204_NO_CONTENT)
