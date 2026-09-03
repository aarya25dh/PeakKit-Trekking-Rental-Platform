from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


class CustomTokenGenerator:
    """
    Generate JWT tokens for authenticated users.
    """

    @staticmethod
    def get_tokens_for_user(user):
        """
        Generate both access and refresh tokens for a user.
        
        Args:
            user: Django User instance
            
        Returns:
            Dictionary with access and refresh tokens
        """
        refresh = RefreshToken.for_user(user)

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

    @staticmethod
    def verify_token(token, token_type='access'):
        """
        Verify if a token is valid.
        
        Args:
            token: JWT token string
            token_type: 'access' or 'refresh'
            
        Returns:
            Boolean indicating if token is valid
        """
        try:
            if token_type == 'access':
                from rest_framework_simplejwt.tokens import TokenTypeError
                token_obj = RefreshToken(token)
            else:
                token_obj = RefreshToken(token)
            return True
        except (TokenError, Exception):
            return False

    @staticmethod
    def refresh_access_token(refresh_token):
        """
        Generate a new access token from refresh token.
        
        Args:
            refresh_token: Refresh token string
            
        Returns:
            New access token or None if invalid
        """
        try:
            refresh = RefreshToken(refresh_token)
            return {
                'access': str(refresh.access_token),
            }
        except TokenError:
            return None
