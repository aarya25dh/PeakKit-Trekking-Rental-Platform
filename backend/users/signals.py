"""
Signals for the users app.

This module ensures that Django signals are properly registered
when the app is loaded.
"""

from .models import create_user_profile, save_user_profile

__all__ = ['create_user_profile', 'save_user_profile']
