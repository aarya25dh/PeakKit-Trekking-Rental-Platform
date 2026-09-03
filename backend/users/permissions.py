from rest_framework.permissions import BasePermission, IsAuthenticated


class IsAuthenticatedUser(IsAuthenticated):
    """
    Permission class to ensure user is authenticated.
    Extends DRF's IsAuthenticated for consistency.
    """
    pass


class IsProfileOwner(BasePermission):
    """
    Permission class to ensure user can only access their own profile.
    """

    def has_object_permission(self, request, view, obj):
        """
        Check if the requesting user is the profile owner.
        
        Args:
            request: HTTP request object
            view: View instance
            obj: The profile object being accessed
            
        Returns:
            Boolean indicating if user has permission
        """
        return obj.user == request.user


class IsNotAuthenticated(BasePermission):
    """
    Permission class to ensure user is NOT authenticated.
    Used for login and registration endpoints.
    """

    def has_permission(self, request, view):
        """
        Check if user is not authenticated.
        """
        return not request.user or not request.user.is_authenticated
