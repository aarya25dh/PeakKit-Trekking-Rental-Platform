from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Profile, Notification


class ProfileInline(admin.StackedInline):
    """Inline admin for Profile model."""
    model = Profile
    can_delete = False
    verbose_name_plural = "Profile"
    fields = (
        'phone_number', 'profile_image', 'address', 'city', 'province',
        'email_verified', 'last_login_ip', 'failed_login_attempts',
        'account_locked_until', 'date_joined', 'updated_at'
    )
    readonly_fields = ('date_joined', 'updated_at', 'last_login_ip')


class UserAdmin(BaseUserAdmin):
    """Extend Django's UserAdmin to include Profile."""
    inlines = (ProfileInline,)


class ProfileAdmin(admin.ModelAdmin):
    """Admin for Profile model."""
    list_display = (
        'get_user_name', 'phone_number', 'city', 'email_verified',
        'failed_login_attempts', 'date_joined'
    )
    list_filter = ('email_verified', 'date_joined', 'city')
    search_fields = ('user__email', 'phone_number', 'user__first_name', 'user__last_name')
    readonly_fields = ('date_joined', 'updated_at', 'email_verification_token_expires', 'password_reset_token_expires')
    
    fieldsets = (
        ('User Info', {'fields': ('user',)}),
        ('Contact Info', {'fields': ('phone_number', 'address', 'city', 'province')}),
        ('Email Verification', {'fields': (
            'email_verified', 'email_verification_token',
            'email_verification_token_expires'
        )}),
        ('Security', {'fields': (
            'last_login_ip', 'failed_login_attempts',
            'account_locked_until'
        )}),
        ('Password Reset', {'fields': (
            'password_reset_token', 'password_reset_token_expires'
        )}),
        ('Timestamps', {'fields': ('date_joined', 'updated_at')}),
    )

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_user_name.short_description = 'User Name'


# Unregister the default UserAdmin and re-register with ProfileInline
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin for Notification model."""
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message', 'related_order_id')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Notification Info', {'fields': ('user', 'notification_type', 'title', 'message')}),
        ('Status', {'fields': ('is_read',)}),
        ('Related', {'fields': ('related_order_id',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
