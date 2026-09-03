from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid


class Profile(models.Model):
    """
    Extended user profile model.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    address = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    province = models.CharField(max_length=100, blank=True, default='')
    email_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # For email verification token
    email_verification_token = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email_verification_token_expires = models.DateTimeField(null=True, blank=True)

    # For password reset token
    password_reset_token = models.CharField(max_length=255, unique=True, null=True, blank=True)
    password_reset_token_expires = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.phone_number}"

    def generate_email_verification_token(self):
        """Generate a unique email verification token."""
        from datetime import timedelta
        from django.utils import timezone
        
        self.email_verification_token = str(uuid.uuid4())
        self.email_verification_token_expires = timezone.now() + timedelta(hours=24)
        self.save()
        return self.email_verification_token

    def generate_password_reset_token(self):
        """Generate a unique password reset token valid for 15 minutes."""
        from datetime import timedelta
        from django.utils import timezone
        
        self.password_reset_token = str(uuid.uuid4())
        self.password_reset_token_expires = timezone.now() + timedelta(minutes=15)
        self.save()
        return self.password_reset_token

    def is_account_locked(self):
        """Check if the account is currently locked."""
        from django.utils import timezone
        
        if self.account_locked_until and timezone.now() < self.account_locked_until:
            return True
        return False

    def unlock_account(self):
        """Unlock the account and reset failed login attempts."""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save()


# Signal to automatically create Profile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal handler to create a Profile when a User is created.
    """
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal handler to save the Profile when User is saved.
    """
    instance.profile.save()


class Notification(models.Model):
    """
    In-app notification model for users.
    """
    NOTIFICATION_TYPES = [
        ('reservation', 'Reservation'),
        ('payment', 'Payment'),
        ('delivery', 'Delivery'),
        ('security', 'Security'),
        ('wishlist', 'Wishlist'),
        ('promotion', 'Promotion'),
        ('system', 'System'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_order_id = models.CharField(max_length=20, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    @staticmethod
    def create_notification(user, notification_type, title, message, related_order_id=None):
        """
        Convenience method to create a notification.
        """
        return Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_order_id=related_order_id
        )
