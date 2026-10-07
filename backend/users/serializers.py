from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import Profile, Notification
from .validators import CustomPasswordValidator, PasswordStrengthChecker
from .tokens import CustomTokenGenerator


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""

    class Meta:
        model = Profile
        fields = [
            'phone_number', 'profile_image', 'address', 'city',
            'province', 'email_verified', 'date_joined'
        ]
        read_only_fields = ['date_joined', 'email_verified']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for basic user information."""
    profile = ProfileSerializer(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'is_staff', 'profile']
        read_only_fields = ['id', 'is_staff']


class RegistrationSerializer(serializers.Serializer):
    """Serializer for user registration."""
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=15, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Validate registration data."""
        # Check if passwords match
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        # Validate password
        validator = CustomPasswordValidator()
        try:
            validator.validate(data['password'])
        except Exception as e:
            raise serializers.ValidationError({
                'password': str(e)
            })

        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'An account with this email already exists.'
            })

        # Check if phone number already exists
        if Profile.objects.filter(phone_number=data['phone_number']).exists():
            raise serializers.ValidationError({
                'phone_number': 'This phone number is already registered.'
            })

        return data

    def create(self, validated_data):
        """Create user and profile."""
        # Remove confirm_password as it's not needed anymore
        validated_data.pop('confirm_password')

        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )

        # Safely get or create profile with phone number
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.phone_number = validated_data['phone_number']
        profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login supporting email or username."""
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Validate login credentials."""
        identifier = str(data.get('email') or data.get('username') or '').strip()
        password = data.get('password')

        if not identifier:
            raise serializers.ValidationError({
                'email': 'Please provide your email address or username.'
            })

        # Flexible user lookup by email or username
        from django.db.models import Q
        username_part = identifier.split('@')[0] if '@' in identifier else identifier
        user = (
            User.objects.filter(
                Q(username__iexact=identifier) |
                Q(email__iexact=identifier) |
                Q(username__iexact=username_part) |
                Q(email__istartswith=username_part + '@')
            ).first()
        )

        if not user:
            raise serializers.ValidationError({
                'email': 'User not found. Please check your username or email address.'
            })

        # Safely get or create profile
        profile, _ = Profile.objects.get_or_create(user=user)

        # Check if account is locked
        if profile.is_account_locked():
            remaining_time = (profile.account_locked_until - timezone.now()).total_seconds() / 60
            raise serializers.ValidationError({
                'detail': f'Account temporarily locked. Try again in {int(remaining_time)} minutes.'
            })

        # Authenticate user
        from django.contrib.auth import authenticate
        authenticated_user = authenticate(username=user.username, password=password)

        if authenticated_user is None:
            # Increment failed login attempts
            profile.failed_login_attempts += 1
            
            # Lock account if 5 failed attempts
            if profile.failed_login_attempts >= 5:
                profile.account_locked_until = timezone.now() + timedelta(minutes=10)
            
            profile.save()

            raise serializers.ValidationError({
                'password': 'Invalid password.'
            })

        # Reset failed login attempts on successful login
        profile.failed_login_attempts = 0
        profile.account_locked_until = None
        req = self.context.get('request')
        if req and hasattr(req, 'META'):
            profile.last_login_ip = req.META.get('REMOTE_ADDR')
        profile.save()

        data['user'] = authenticated_user
        return data


class PasswordStrengthSerializer(serializers.Serializer):
    """Serializer for password strength check."""
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Check password strength."""
        checker = PasswordStrengthChecker()
        data['strength_info'] = checker.check_strength(data['password'])
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Validate that the email exists."""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'No account found with this email address.'
            )
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset."""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Validate reset password data."""
        # Check if passwords match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })

        # Validate password strength
        validator = CustomPasswordValidator()
        try:
            validator.validate(data['new_password'])
        except Exception as e:
            raise serializers.ValidationError({
                'new_password': str(e)
            })

        # Validate token
        try:
            profile = Profile.objects.get(password_reset_token=data['token'])
        except Profile.DoesNotExist:
            raise serializers.ValidationError({
                'token': 'Invalid or expired reset token.'
            })

        # Check if token is expired
        if profile.password_reset_token_expires < timezone.now():
            raise serializers.ValidationError({
                'token': 'Password reset token has expired. Please request a new one.'
            })

        data['profile'] = profile
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password (authenticated users)."""
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Validate change password data."""
        user = self.context['request'].user

        # Check current password
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({
                'current_password': 'Current password is incorrect.'
            })

        # Check if passwords match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })

        # Validate password strength
        validator = CustomPasswordValidator()
        try:
            validator.validate(data['new_password'])
        except Exception as e:
            raise serializers.ValidationError({
                'new_password': str(e)
            })

        return data


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(max_length=150, source='user.first_name')
    last_name = serializers.CharField(max_length=150, source='user.last_name')
    email = serializers.EmailField(source='user.email', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'first_name', 'last_name', 'email', 'is_staff', 'phone_number',
            'profile_image', 'address', 'city', 'province'
        ]
        read_only_fields = ['username', 'email', 'phone_number', 'is_staff']

    def update(self, instance, validated_data):
        """Update profile and user data."""
        # Update user fields
        user_data = validated_data.pop('user', {})
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            instance.user.last_name = user_data['last_name']
        instance.user.save()

        # Update profile fields
        return super().update(instance, validated_data)


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Validate that the email exists and is not already verified."""
        try:
            user = User.objects.get(email=value)
            # Safely get or create profile
            profile, _ = Profile.objects.get_or_create(user=user)
            if profile.email_verified:
                raise serializers.ValidationError(
                    'This email is already verified.'
                )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'No account found with this email address.'
            )
        return value


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications."""
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'related_order_id', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')


class NotificationListSerializer(serializers.ModelSerializer):
    """Serializer for listing notifications."""
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'related_order_id', 'is_read', 'created_at')
        read_only_fields = fields


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read."""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    mark_all = serializers.BooleanField(default=False)

    def update(self, instance, validated_data):
        """Mark notifications as read."""
        if validated_data.get('mark_all'):
            Notification.objects.filter(user=instance).update(is_read=True)
        else:
            notification_ids = validated_data.get('notification_ids', [])
            Notification.objects.filter(id__in=notification_ids, user=instance).update(is_read=True)
        return instance
