from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    PasswordStrengthView,
    ForgotPasswordView,
    ResetPasswordView,
    SendVerificationEmailView,
    VerifyEmailView,
    UserProfileView,
    ChangePasswordView,
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkOneReadView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
    NotificationDeleteView,
)

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    
    # Password management
    path('auth/password-strength/', PasswordStrengthView.as_view(), name='password_strength'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Email verification
    path('auth/send-verification/', SendVerificationEmailView.as_view(), name='send_verification'),
    path('auth/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Notification endpoints
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification_read_all'),
    path('notifications/read/', NotificationMarkReadView.as_view(), name='notification_read'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification_unread_count'),
    path('notifications/mark-read/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('notifications/<int:notification_id>/read/', NotificationMarkOneReadView.as_view(), name='notification_read_one'),
    path('notifications/<int:notification_id>/', NotificationDeleteView.as_view(), name='notification_delete'),
]
